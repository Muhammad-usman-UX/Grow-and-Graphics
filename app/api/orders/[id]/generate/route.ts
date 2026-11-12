import { NextResponse } from "next/server";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { isProductSlug } from "@/lib/products";
import { STATUS } from "@/lib/status";
import { isUuid } from "@/lib/forms";
import { buildBasePrompt } from "@/lib/prompts";
import { getDetails, runRound } from "@/lib/generate";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Starts (or continues) draft generation. Public on purpose: the client's browser calls it automatically
 * right after Step 2. It only works while the order is in a generating state, so it cannot be abused to
 * regenerate finished orders. Call it again until it answers { done: true }.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!isUuid(id)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Not configured." }, { status: 503 });
  const sb = getAdminClient();

  let { data: order } = await sb.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order || !isProductSlug(order.product)) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Begin a new round (first draft, or after a client change request)
  if (order.status === STATUS.DETAILS || order.status === STATUS.REVISION) {
    const patch: Record<string, unknown> = { status: STATUS.GENERATING, gen_round: order.gen_round + 1, gen_error: null, gen_lock: null };
    if (order.status === STATUS.DETAILS) patch.ai_prompt = buildBasePrompt(order.product, await getDetails(id), order.client_reply);
    const claimed = await sb.from("orders").update(patch).eq("id", id).eq("status", order.status).select("*");
    order = claimed.data?.[0] ?? (await sb.from("orders").select("*").eq("id", id).maybeSingle()).data;
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status !== STATUS.GENERATING) return NextResponse.json({ done: true, status: order.status });

  const now = new Date();
  const lock = await sb.from("orders").update({ gen_lock: new Date(now.getTime() + 75_000).toISOString() })
    .eq("id", id).eq("status", STATUS.GENERATING).or(`gen_lock.is.null,gen_lock.lt.${now.toISOString()}`).select("id");
  if (!lock.data?.length) return NextResponse.json({ done: false, busy: true });

  try {
    const r = await runRound(order);
    if (r.error) {
      await sb.from("orders").update({ status: STATUS.FAILED, gen_error: r.error.slice(0, 500), gen_lock: null }).eq("id", id);
      return NextResponse.json({ done: true, status: STATUS.FAILED, error: "Generation failed." });
    }
    if (r.done) {
      await sb.from("orders").update({ status: STATUS.ADMIN_REVIEW, gen_lock: null, gen_error: null }).eq("id", id).eq("status", STATUS.GENERATING);
      return NextResponse.json({ done: true, status: STATUS.ADMIN_REVIEW });
    }
    await sb.from("orders").update({ gen_lock: null }).eq("id", id);
    return NextResponse.json({ done: false, remaining: r.remaining });
  } catch (e) {
    await sb.from("orders").update({ status: STATUS.FAILED, gen_error: (e instanceof Error ? e.message : "Unknown error").slice(0, 500), gen_lock: null }).eq("id", id);
    return NextResponse.json({ done: true, status: STATUS.FAILED, error: "Generation failed." });
  }
}
