import "server-only";
import { BUCKET, getAdminClient } from "./supabase/admin";
import { isProductSlug, type ProductSlug } from "./products";
import { tasksFor, type Task } from "./tasks";
import { taskPrompt, type Details } from "./prompts";
import { parseColours } from "./colours";
import { finishImage, generateImage, transparentPng, type Aspect, type MockSpec } from "./imageProvider";
import { auditToPdf, buildAuditReport } from "./audit";
import { sniffImage } from "./forms";

const START_LIMIT_MS = 18_000; // do not start a new batch after this; each call must finish inside maxDuration (60s)
const CONCURRENCY = 3;

interface OrderRow { id: string; product: string; gen_round: number; ai_prompt: string | null; round_note: string | null }

export async function getDetails(orderId: string): Promise<Details> {
  const { data } = await getAdminClient().from("order_details").select("field_name,field_value").eq("order_id", orderId);
  return Object.fromEntries((data ?? []).map((r) => [r.field_name, r.field_value]));
}

async function save(orderId: string, version: number, label: string, path: string, bytes: Uint8Array | Buffer, type: string) {
  const sb = getAdminClient();
  const up = await sb.storage.from(BUCKET).upload(path, bytes, { contentType: type, upsert: true });
  if (up.error) throw new Error(`Storage upload failed: ${up.error.message}`);
  const ins = await sb.from("drafts").upsert({ order_id: orderId, file_url: path, file_type: type, label, version, status: "pending_admin" }, { onConflict: "order_id,version,label", ignoreDuplicates: true });
  if (ins.error) throw new Error(`Saving draft failed: ${ins.error.message}`);
}

async function loadReference(d: Details, product: ProductSlug): Promise<{ bytes: Buffer; mime: string } | undefined> {
  const path = d.reference_file || d.upload_file;
  if (!path || product === "ui-ux-audit") return undefined;
  const { data } = await getAdminClient().storage.from(BUCKET).download(path);
  if (!data) return undefined;
  const bytes = Buffer.from(await data.arrayBuffer());
  const mime = sniffImage(bytes);
  return mime ? { bytes, mime } : undefined;
}

async function runTask(order: OrderRow, product: ProductSlug, task: Task, d: Details, clientRef?: { bytes: Buffer; mime: string }) {
  const sb = getAdminClient();
  const base = order.ai_prompt ?? "";
  const v = order.gen_round;
  const dir = `orders/${order.id}/v${v}`;

  if (task.kind === "audit") {
    const report = await buildAuditReport(d, base, order.round_note);
    const pdf = await auditToPdf(report, d);
    await save(order.id, v, "audit:pdf", `${dir}/audit.pdf`, pdf, "application/pdf");
    return;
  }

  // Image tasks
  let reference = task.after ? undefined : clientRef;
  if (task.after) {
    const { data: row } = await sb.from("drafts").select("file_url").eq("order_id", order.id).eq("version", v).eq("label", `${task.after}:png`).maybeSingle();
    if (row) {
      const dl = await sb.storage.from(BUCKET).download(row.file_url);
      if (dl.data) reference = { bytes: Buffer.from(await dl.data.arrayBuffer()), mime: "image/png" };
    }
  }

  let w = 1024, h = 1024, aspect: Aspect = "square", fit: "cover" | "contain" = "contain";
  const mock: MockSpec = { layout: "card", title: d.business_name ?? "Preview", badge: "MOCK PREVIEW", colours: parseColours(d.colours ?? ""), width: 0, height: 0 };
  if (product === "instagram-post") {
    fit = "cover";
    if (d.size?.includes("1920")) { w = 1080; h = 1920; aspect = "portrait"; } else { w = 1080; h = 1080; }
    mock.title = d.headline ?? mock.title; mock.subtitle = d.cta;
  } else if (product === "facebook-banner") {
    fit = "cover"; w = 820; h = 312; aspect = "wide";
    mock.title = d.headline ?? mock.title; mock.subtitle = d.subtext;
  } else {
    mock.layout = task.version ?? "primary";
    mock.badge = `MOCK LOGO CONCEPT ${task.concept} - ${(task.version ?? "").toUpperCase()}`;
  }
  mock.width = w; mock.height = h;

  const raw = await generateImage({ prompt: taskPrompt(product, task, base, order.round_note, Boolean(reference)), aspect, reference, mock });
  const { png, jpg } = await finishImage(raw, w, h, fit);
  await save(order.id, v, `${task.id}:png`, `${dir}/${task.id}.png`, png, "image/png");
  await save(order.id, v, `${task.id}:jpg`, `${dir}/${task.id}.jpg`, jpg, "image/jpeg");
  if (product === "logo-design") {
    await save(order.id, v, `${task.id}:transparent`, `${dir}/${task.id}-transparent.png`, await transparentPng(png), "image/png");
  }
}

export type RoundResult = { done: boolean; remaining: number; error?: string };

/** Works through the tasks of the current round until done or the time budget is used. Safe to call again: finished tasks are skipped. */
export async function runRound(order: OrderRow): Promise<RoundResult> {
  if (!isProductSlug(order.product)) return { done: true, remaining: 0 };
  const product = order.product;
  const sb = getAdminClient();
  const start = Date.now();
  const tasks = tasksFor(product);
  const details = await getDetails(order.id);
  const ref = await loadReference(details, product);

  const doneIds = async () => {
    const { data } = await sb.from("drafts").select("label").eq("order_id", order.id).eq("version", order.gen_round);
    return new Set((data ?? []).map((r) => String(r.label).split(":")[0]));
  };

  let done = await doneIds();
  while (Date.now() - start < START_LIMIT_MS) {
    const runnable = tasks.filter((t) => !done.has(t.id) && (!t.after || done.has(t.after))).slice(0, CONCURRENCY);
    if (!runnable.length) break;
    const results = await Promise.allSettled(runnable.map((t) => runTask(order, product, t, details, ref)));
    const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failed) return { done: false, remaining: tasks.length - done.size, error: failed.reason instanceof Error ? failed.reason.message : String(failed.reason) };
    done = await doneIds();
  }
  const remaining = tasks.filter((t) => !done.has(t.id)).length;
  return { done: remaining === 0, remaining };
}
