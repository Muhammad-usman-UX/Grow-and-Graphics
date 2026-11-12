import { NextResponse } from "next/server";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/forms";

export const runtime = "nodejs";

/** Tracks Google review clicks. Only for 4 and 5 star reviews. "done" is self-reported by the client. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id) || !isSupabaseConfigured()) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const field = b.event === "done" ? "google_review_done" : b.event === "clicked" ? "google_review_clicked" : null;
  if (!field) return NextResponse.json({ error: "Unknown event." }, { status: 400 });
  const patch = field === "google_review_done" ? { google_review_clicked: true, google_review_done: true } : { google_review_clicked: true };
  const { data } = await getAdminClient().from("reviews").update(patch).eq("order_id", params.id).gte("rating", 4).select("id");
  return data?.length ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found." }, { status: 404 });
}
