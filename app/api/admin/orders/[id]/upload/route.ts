import { NextResponse } from "next/server";
import { BUCKET, getAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/supabase/server";
import { STATUS } from "@/lib/status";
import { isUuid, sniffImage } from "@/lib/forms";

export const runtime = "nodejs";

/** Manual backup: admin uploads a finished file (JPG, PNG or PDF, up to 4 MB). It joins the current round as a pending draft, so it still needs Approve. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isUuid(params.id)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const fd = await req.formData().catch(() => null);
  const file = fd?.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a file." }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "Maximum 4 MB." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  const img = sniffImage(bytes);
  if (!isPdf && !img) return NextResponse.json({ error: "Only JPG, PNG or PDF files." }, { status: 400 });
  const type = isPdf ? "application/pdf" : img!;
  const ext = isPdf ? "pdf" : img === "image/png" ? "png" : "jpg";

  const sb = getAdminClient();
  const { data: o } = await sb.from("orders").select("id,status,gen_round").eq("id", params.id).maybeSingle();
  if (!o) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!([STATUS.ADMIN_REVIEW, STATUS.FAILED] as string[]).includes(o.status)) return NextResponse.json({ error: "Upload is only available while the order waits for admin review." }, { status: 409 });

  const name = `manual-${Date.now()}`;
  const path = `orders/${o.id}/v${o.gen_round}/${name}.${ext}`;
  const up = await sb.storage.from(BUCKET).upload(path, bytes, { contentType: type, upsert: true });
  if (up.error) return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  await sb.from("drafts").insert({ order_id: o.id, file_url: path, file_type: type, label: `${name}:file`, version: o.gen_round, status: "pending_admin" });
  if (o.status === STATUS.FAILED) await sb.from("orders").update({ status: STATUS.ADMIN_REVIEW, gen_error: null }).eq("id", o.id);
  return NextResponse.json({ ok: true });
}
