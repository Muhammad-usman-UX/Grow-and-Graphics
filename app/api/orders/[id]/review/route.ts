import { NextResponse } from "next/server";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { PRODUCTS, isProductSlug } from "@/lib/products";
import { STATUS } from "@/lib/status";
import { isUuid } from "@/lib/forms";

export const runtime = "nodejs";

/** Internal review. Only after Delivered. Saved as not approved: admin must approve it before it shows on the site. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!isUuid(id)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Not configured." }, { status: 503 });
  const b = await req.json().catch(() => ({}));
  const rating = Number(b.rating);
  const name = String(b.name ?? "").trim().slice(0, 80);
  const comment = String(b.comment ?? "").trim().slice(0, 1500);
  const priv = String(b.privateFeedback ?? "").trim().slice(0, 1500);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Choose 1 to 5 stars." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!comment) return NextResponse.json({ error: "Please write a short comment." }, { status: 400 });

  const sb = getAdminClient();
  const { data: order } = await sb.from("orders").select("id,product,status").eq("id", id).maybeSingle();
  if (!order || !isProductSlug(order.product)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== STATUS.DELIVERED) return NextResponse.json({ error: "Reviews open after delivery." }, { status: 409 });

  const { error } = await sb.from("reviews").insert({
    order_id: id, product: PRODUCTS[order.product].slug, rating, name, comment,
    private_feedback: rating <= 3 && priv ? priv : null, approved: false,
  });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "You already left a review for this order." : "Could not save your review." }, { status: error.code === "23505" ? 409 : 500 });
  return NextResponse.json({ ok: true, showGoogle: rating >= 4 });
}
