import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/supabase/server";
import { STATUS } from "@/lib/status";
import { isUuid } from "@/lib/forms";
import { PRODUCTS, isProductSlug, type ProductSlug } from "@/lib/products";
import { sendDraftReady } from "@/lib/email";

export const runtime = "nodejs";

/** Admin buttons: approve, needs_work, improve, ask_details, retry. Admin only (checked here as well as in middleware). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const id = params.id;
  if (!isUuid(id)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action ?? "");
  const note = String(b.note ?? "").trim().slice(0, 2000);
  const prompt = String(b.prompt ?? "").trim().slice(0, 8000);
  const sb = getAdminClient();

  const { data: o } = await sb.from("orders").select("*").eq("id", id).maybeSingle();
  if (!o || !isProductSlug(o.product)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const slug: ProductSlug = o.product;

  // Start a new generation round. The browser then calls /api/orders/[id]/generate until done. The result returns to admin, never to the client.
  const regenerate = async (patch: Record<string, unknown>, rejectNote: string | null) => {
    await sb.from("drafts").update({ status: "rejected", admin_note: rejectNote }).eq("order_id", id).eq("version", o.gen_round).in("status", ["pending_admin", "approved"]);
    const moved = await sb.from("orders").update({ status: STATUS.GENERATING, gen_round: o.gen_round + 1, gen_error: null, gen_lock: null, ...patch }).eq("id", id).eq("status", o.status).select("id");
    if (!moved.data?.length) return NextResponse.json({ error: "The order changed. Refresh and try again." }, { status: 409 });
    return NextResponse.json({ ok: true, regenerate: true });
  };

  const reviewable = [STATUS.ADMIN_REVIEW, STATUS.FAILED] as string[];

  if (action === "approve") {
    if (o.status !== STATUS.ADMIN_REVIEW) return NextResponse.json({ error: "Only a draft waiting for review can be approved." }, { status: 409 });
    const pending = await sb.from("drafts").update({ status: "approved" }).eq("order_id", id).eq("version", o.gen_round).eq("status", "pending_admin").select("id");
    if (!pending.data?.length) return NextResponse.json({ error: "There is no draft to approve." }, { status: 409 });
    await sb.from("orders").update({ status: STATUS.CLIENT_REVIEW, admin_note: null }).eq("id", id).eq("status", STATUS.ADMIN_REVIEW);
    const emailed = await sendDraftReady({ id, client_name: o.client_name, client_email: o.client_email, productName: PRODUCTS[slug].name });
    return NextResponse.json({ ok: true, emailed });
  }

  if (action === "needs_work") {
    if (!reviewable.includes(o.status)) return NextResponse.json({ error: "This order is not waiting for review." }, { status: 409 });
    if (!note) return NextResponse.json({ error: "Please add a note saying what is wrong." }, { status: 400 });
    return regenerate({ admin_note: note, round_note: note }, note);
  }

  if (action === "improve") {
    if (!reviewable.includes(o.status)) return NextResponse.json({ error: "This order is not waiting for review." }, { status: 409 });
    if (!prompt && !note) return NextResponse.json({ error: "Edit the prompt or add a note first." }, { status: 400 });
    return regenerate({ ai_prompt: prompt || o.ai_prompt, admin_note: note || null, round_note: note || null }, note || "Prompt improved by admin");
  }

  if (action === "retry") {
    if (o.status !== STATUS.FAILED) return NextResponse.json({ error: "Only failed orders can be retried." }, { status: 409 });
    await sb.from("orders").update({ status: STATUS.GENERATING, gen_error: null, gen_lock: null }).eq("id", id).eq("status", STATUS.FAILED);
    return NextResponse.json({ ok: true, regenerate: true });
  }

  if (action === "ask_details") {
    if (!([STATUS.ADMIN_REVIEW, STATUS.FAILED, STATUS.DETAILS] as string[]).includes(o.status)) return NextResponse.json({ error: "Cannot ask for details at this stage." }, { status: 409 });
    if (!note) return NextResponse.json({ error: "Write what you need from the client." }, { status: 400 });
    await sb.from("orders").update({ status: STATUS.NEEDS_DETAILS, client_request: note, client_reply: null }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
