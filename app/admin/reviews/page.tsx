import { redirect } from "next/navigation";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/supabase/server";
import AdminReviewControls from "@/components/AdminReviewRow";

export default async function AdminReviews() {
  if (!(await getAdminUser())) redirect("/admin/login");
  if (!isSupabaseConfigured()) return <p className="err">Supabase is not configured.</p>;
  const { data } = await getAdminClient().from("reviews").select("*").order("created_at", { ascending: false }).limit(200);

  return (
    <>
      <h1 className="text-3xl font-extrabold">Reviews</h1>
      <p className="mt-1 text-sm text-navy/60">Only approved reviews appear on the website.</p>
      <ul className="mt-6 space-y-4 pb-10">
        {(data ?? []).map((r) => (
          <li key={r.id} className="card p-5">
            <p className="text-brand">{"★".repeat(r.rating)}<span className="text-navy/20">{"★".repeat(5 - r.rating)}</span> <span className="ml-2 text-xs font-semibold text-navy/60">{r.approved ? "Approved" : "Hidden / waiting"}</span></p>
            <p className="mt-1 text-sm">{r.comment}</p>
            <p className="mt-1 text-sm font-semibold">{r.name} · {r.product}</p>
            {r.private_feedback && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm"><b>Private feedback:</b> {r.private_feedback}</p>}
            <p className="mt-2 text-xs text-navy/60">Google clicked: {r.google_review_clicked ? "yes" : "no"} · Google done: {r.google_review_done ? "yes" : "no"}</p>
            <AdminReviewControls id={r.id} approved={r.approved} googleDone={r.google_review_done} />
          </li>
        ))}
        {!data?.length && <li className="text-navy/60">No reviews yet.</li>}
      </ul>
    </>
  );
}
