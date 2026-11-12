import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/supabase/server";
import { isUuid } from "@/lib/forms";

export const runtime = "nodejs";

/** Admin moderation: Approve / Hide a review, or mark the Google review as done. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isUuid(params.id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const patch: Record<string, boolean> = {};
  if (typeof b.approved === "boolean") patch.approved = b.approved;
  if (typeof b.google_review_done === "boolean") patch.google_review_done = b.google_review_done;
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  const { error } = await getAdminClient().from("reviews").update(patch).eq("id", params.id);
  return error ? NextResponse.json({ error: "Could not update." }, { status: 500 }) : NextResponse.json({ ok: true });
}
