import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { PRODUCTS, isProductSlug } from "@/lib/products";
import { STATUS, TIMELINE, clientMessage, timelineIndex } from "@/lib/status";
import { isUuid } from "@/lib/forms";
import { loadDrafts } from "@/lib/drafts";
import { SITE } from "@/lib/site";
import DraftGallery from "@/components/DraftGallery";
import ClientActions from "@/components/ClientActions";
import GenerationRunner from "@/components/GenerationRunner";
import ReviewForm from "@/components/ReviewForm";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Private order page. Anyone with the link can open it, so it shows no email or phone number.
 * Drafts appear here ONLY after admin approval (status "First Draft Ready for Client Review").
 */
export default async function OrderPage({ params }: { params: { id: string } }) {
  if (!isUuid(params.id) || !isSupabaseConfigured()) notFound();
  const sb = getAdminClient();

  const { data: order } = await sb.from("orders").select("id,product,client_name,status,client_request,revision_count,gen_round").eq("id", params.id).maybeSingle();
  if (!order || !isProductSlug(order.product)) notFound();

  const product = PRODUCTS[order.product];
  const current = timelineIndex(order.status);
  const generating = ([STATUS.DETAILS, STATUS.GENERATING, STATUS.REVISION] as string[]).includes(order.status);

  const inReview = order.status === STATUS.CLIENT_REVIEW;
  const delivered = order.status === STATUS.DELIVERED;
  const files = inReview
    ? await loadDrafts(order.id, { statuses: ["approved"], version: order.gen_round, product: order.product })
    : delivered
      ? await loadDrafts(order.id, { statuses: ["final"], version: order.gen_round, product: order.product, download: true })
      : [];

  const { data: review } = delivered ? await sb.from("reviews").select("rating,google_review_clicked,google_review_done").eq("order_id", order.id).maybeSingle() : { data: null };

  return (
    <section className="wrap max-w-4xl pt-14 pb-10">
      <p className="eyebrow">Your order</p>
      <h1 className="mt-2 text-3xl font-extrabold">{product.name}</h1>
      <p className="mt-1 text-navy/70">Hi {order.client_name.split(" ")[0]}, here is where things stand.</p>

      <ol className="mt-8 space-y-3" aria-label="Order progress">
        {TIMELINE.map((s, i) => {
          const done = i < current || delivered;
          const now = i === current && !delivered;
          return (
            <li key={s} className={`flex items-center gap-3 rounded-xl border p-4 ${now ? "border-brand bg-brand-mint" : "border-navy/10"}`} aria-current={now ? "step" : undefined}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-brand text-white" : now ? "bg-navy text-white" : "bg-navy/10 text-navy/60"}`}>{done ? "✓" : i + 1}</span>
              <span className={now ? "font-semibold" : done ? "" : "text-navy/60"}>{s}</span>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 rounded-xl bg-navy-50 p-4 text-navy/85" role="status">{clientMessage(order.status)}</p>

      {generating && <GenerationRunner orderId={order.id} />}

      {order.status === STATUS.CONFIRMED && (
        <Link href={`/checkout/${order.product}?order=${order.id}`} className="btn btn-primary mt-5">Continue to project details</Link>
      )}

      {order.status === STATUS.NEEDS_DETAILS && (
        <div className="card mt-5 p-5">
          <p className="text-sm font-semibold">What we need from you</p>
          <p className="mt-2 whitespace-pre-wrap text-navy/80">{order.client_request}</p>
          <ClientActions orderId={order.id} mode="reply" revisionsLeft={0} />
        </div>
      )}

      {inReview && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold">Your first draft</h2>
          <DraftGallery files={files} product={order.product} linkMode="none" />
          <ClientActions orderId={order.id} mode="review" revisionsLeft={Math.max(0, 2 - order.revision_count)} />
        </div>
      )}

      {delivered && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold">Your final files</h2>
          <DraftGallery files={files} product={order.product} linkMode="download" />
          <ReviewForm
            orderId={order.id}
            defaultName={order.client_name}
            productName={product.name}
            googleUrl={SITE.googleReviewUrl}
            existing={review ? { rating: review.rating, clicked: review.google_review_clicked, done: review.google_review_done } : null}
          />
        </div>
      )}
    </section>
  );
}
