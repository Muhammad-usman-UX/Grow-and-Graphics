import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminClient, isSupabaseConfigured, BUCKET } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/supabase/server";
import { PRODUCTS, isProductSlug, type ProductSlug } from "@/lib/products";
import { FORMS, isUuid } from "@/lib/forms";
import { STATUS } from "@/lib/status";
import { loadDrafts } from "@/lib/drafts";
import AdminActions from "@/components/AdminActions";
import DraftGallery from "@/components/DraftGallery";
import GenerationRunner from "@/components/GenerationRunner";

export default async function AdminOrder({ params }: { params: { id: string } }) {
  if (!(await getAdminUser())) redirect("/admin/login");
  if (!isUuid(params.id) || !isSupabaseConfigured()) notFound();
  const sb = getAdminClient();

  const { data: o } = await sb.from("orders").select("*").eq("id", params.id).maybeSingle();
  if (!o || !isProductSlug(o.product)) notFound();
  const slug: ProductSlug = o.product;
  const product = PRODUCTS[slug];

  const { data: details } = await sb.from("order_details").select("field_name,field_value").eq("order_id", o.id);
  const byName = new Map((details ?? []).map((d) => [d.field_name, d.field_value]));
  const answers = FORMS[slug].map((f) => ({ f, v: byName.get(f.name) })).filter((x) => x.v);

  const uploadSigned: Record<string, string> = {};
  for (const { f, v } of answers) {
    if (f.type === "file" && v) {
      const s = await sb.storage.from(BUCKET).createSignedUrl(v, 3600);
      if (s.data) uploadSigned[f.name] = s.data.signedUrl;
    }
  }

  const drafts = o.gen_round > 0 ? await loadDrafts(o.id, { version: o.gen_round, product: o.product }) : [];
  const pending = drafts.filter((d) => d.status === "pending_admin" || d.status === "approved");
  const { data: review } = await sb.from("reviews").select("rating,comment,private_feedback,google_review_clicked,google_review_done,approved").eq("order_id", o.id).maybeSingle();

  const inReview = o.status === STATUS.ADMIN_REVIEW;
  const canReview = inReview || o.status === STATUS.FAILED;

  return (
    <div className="space-y-8 pb-10">
      <Link href="/admin" className="text-sm font-semibold text-brand-dark">Back to orders</Link>
      <header>
        <h1 className="text-3xl font-extrabold">{product.name}</h1>
        <p className="mt-1 text-navy/70">{o.client_name} · {o.client_email} · WhatsApp {o.client_whatsapp}</p>
        <p className="mt-1 text-sm text-navy/60">Ordered {new Date(o.created_at).toLocaleString("en-GB")} · Status: <b>{o.status}</b> · Round {o.gen_round} · Client revisions used {o.revision_count}/2</p>
        <p className="mt-1 text-xs text-navy/50">Client link: <Link href={`/order/${o.id}`} className="underline">/order/{o.id}</Link></p>
      </header>

      {o.status === STATUS.GENERATING && <GenerationRunner orderId={o.id} message="Generating a new draft. It will return here for your review, not to the client." />}
      {o.status === STATUS.FAILED && <p className="err rounded-lg bg-red-50 p-3" role="alert">Generation failed: {o.gen_error ?? "unknown error"}. Fix the cause (for example a missing key), then use Retry.</p>}
      {o.status === STATUS.NEEDS_DETAILS && <p className="rounded-lg bg-navy-50 p-3 text-sm">Waiting for the client to answer: <i>{o.client_request}</i></p>}
      {o.client_reply && <p className="rounded-lg bg-brand-mint p-3 text-sm"><b>Client answered:</b> {o.client_reply}</p>}
      {o.client_change_note && (o.status === STATUS.REVISION || o.status === STATUS.GENERATING || inReview) && <p className="rounded-lg bg-brand-mint p-3 text-sm"><b>Client change request:</b> {o.client_change_note}</p>}

      <section>
        <h2 className="text-xl font-bold">Client answers (Step 2)</h2>
        {answers.length ? (
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {answers.map(({ f, v }) => (
              <div key={f.name} className="card p-3">
                <dt className="text-xs font-semibold text-navy/60">{f.label}</dt>
                <dd className="mt-1 break-words text-sm">{f.type === "file" ? (uploadSigned[f.name] ? <a className="underline" href={uploadSigned[f.name]} target="_blank" rel="noopener noreferrer">Open uploaded file</a> : "File uploaded") : v}</dd>
              </div>
            ))}
          </dl>
        ) : <p className="mt-2 text-navy/60">The client has not submitted Step 2 yet.</p>}
      </section>

      <section>
        <h2 className="text-xl font-bold">AI draft preview</h2>
        {pending.length ? <div className="mt-4"><DraftGallery files={pending} product={o.product} linkMode="open" /></div> : <p className="mt-2 text-navy/60">No draft to show yet.</p>}
      </section>

      {o.gen_round > 0 && <AdminActions orderId={o.id} status={o.status} prompt={o.ai_prompt ?? ""} canApprove={inReview && pending.some((d) => d.status === "pending_admin")} canReview={canReview} />}

      {review && (
        <section className="card p-5">
          <h2 className="text-lg font-bold">Client review</h2>
          <p className="mt-1 text-brand">{"★".repeat(review.rating)}<span className="text-navy/20">{"★".repeat(5 - review.rating)}</span> {review.approved ? "(approved)" : "(not approved)"}</p>
          <p className="mt-1 text-sm">{review.comment}</p>
          {review.private_feedback && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm"><b>Private feedback:</b> {review.private_feedback}</p>}
          <p className="mt-2 text-xs text-navy/60">Google clicked: {review.google_review_clicked ? "yes" : "no"} · Google done: {review.google_review_done ? "yes" : "no"}</p>
        </section>
      )}
    </div>
  );
}
