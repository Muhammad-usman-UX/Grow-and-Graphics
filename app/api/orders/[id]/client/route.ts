import { NextResponse } from "next/server";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { STATUS } from "@/lib/status";
import { isUuid } from "@/lib/forms";

export const runtime = "nodejs";
const MAX_REVISIONS = 2;

/** Client actions on their private order page: approve the draft, request changes, or answer a request for details. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!isUuid(id)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Not configured." }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const note = String(body.note ?? "").trim().slice(0, 2000);
  const sb = getAdminClient();

  const { data: order } = await sb.from("orders").select("id,status,revision_count,gen_round").eq("id", id).maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (action === "approve") {
    if (order.status !== STATUS.CLIENT_REVIEW) return NextResponse.json({ error: "There is no draft to approve right now." }, { status: 409 });
    const moved = await sb.from("orders").update({ status: STATUS.DELIVERED, delivered_at: new Date().toISOString() }).eq("id", id).eq("status", STATUS.CLIENT_REVIEW).select("id");
    if (!moved.data?.length) return NextResponse.json({ error: "Already updated." }, { status: 409 });
    await sb.from("drafts").update({ status: "final" }).eq("order_id", id).eq("version", order.gen_round).eq("status", "approved");
    return NextResponse.json({ ok: true });
  }

  if (action === "revise") {
    if (order.status !== STATUS.CLIENT_REVIEW) return NextResponse.json({ error: "You can only request changes while reviewing a draft." }, { status: 409 });
    if (!note) return NextResponse.json({ error: "Please describe the changes you want." }, { status: 400 });
    if (order.revision_count >= MAX_REVISIONS) return NextResponse.json({ error: "You have used both free revisions." }, { status: 409 });
    const moved = await sb.from("orders")
      .update({ status: STATUS.REVISION, revision_count: order.revision_count + 1, client_change_note: note, round_note: note })
      .eq("id", id).eq("status", STATUS.CLIENT_REVIEW).select("id");
    if (!moved.data?.length) return NextResponse.json({ error: "Already updated." }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  if (action === "reply") {
    if (order.status !== STATUS.NEEDS_DETAILS) return NextResponse.json({ error: "Nothing to answer right now." }, { status: 409 });
    if (!note) return NextResponse.json({ error: "Please write your answer." }, { status: 400 });
    await sb.from("orders").update({ client_reply: note, status: STATUS.ADMIN_REVIEW }).eq("id", id).eq("status", STATUS.NEEDS_DETAILS);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
