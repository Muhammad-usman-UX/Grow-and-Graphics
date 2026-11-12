import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COMING_SOON, PRODUCTS, isProductSlug } from "@/lib/products";
import { getReviewSummary } from "@/lib/reviews";

export const revalidate = 60;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  if (isProductSlug(params.slug)) return { title: PRODUCTS[params.slug].name, description: PRODUCTS[params.slug].blurb };
  const c = COMING_SOON.find((x) => x.slug === params.slug);
  return c ? { title: c.name, description: c.blurb } : {};
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  if (!isProductSlug(slug)) {
    const c = COMING_SOON.find((x) => x.slug === slug);
    if (!c) notFound();
    return (
      <section className="wrap max-w-3xl pt-16">
        <Link href="/shop" className="text-sm font-semibold text-brand-dark">Back to shop</Link>
        <h1 className="mt-4 text-4xl font-extrabold">{c.name}</h1>
        <p className="mt-3 text-lg text-navy/70">{c.blurb}</p>
        <p className="mt-6 inline-block rounded-full bg-navy/10 px-4 py-2 text-sm font-semibold">Coming soon</p>
      </section>
    );
  }

  const p = PRODUCTS[slug];
  const reviews = await getReviewSummary(slug);

  return (
    <section className="wrap max-w-4xl pt-16">
      <Link href="/shop" className="text-sm font-semibold text-brand-dark">Back to shop</Link>
      <div className="mt-4 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-3">
          <h1 className="text-4xl font-extrabold">{p.name}</h1>
          <p className="mt-3 text-lg text-navy/70">{p.blurb}</p>
          <h2 className="mt-8 text-lg font-bold">What you get</h2>
          <ul className="mt-3 space-y-2">
            {p.includes.map((i) => <li key={i} className="before:mr-2 before:text-brand before:content-['✓']">{i}</li>)}
            <li className="before:mr-2 before:text-brand before:content-['✓']">{p.delivery}</li>
            <li className="before:mr-2 before:text-brand before:content-['✓']">{p.revisions}</li>
          </ul>
        </div>
        <aside className="card h-fit p-6 md:col-span-2">
          <p className="text-3xl font-extrabold text-brand-dark">FREE</p>
          <p className="text-sm text-navy/60">Launch Offer {p.oldPrice && <s className="ml-1">{p.oldPrice}</s>}</p>
          <Link href={`/checkout/${p.slug}`} className="btn btn-primary mt-5 w-full">Get It Free</Link>
          <p className="mt-3 text-xs text-navy/60">No payment. One free order per email or WhatsApp number.</p>
        </aside>
      </div>

      {reviews.count > 0 && (
        <div className="mt-14">
          <h2 className="text-2xl font-extrabold">Reviews</h2>
          <p className="mt-1 text-navy/70">{reviews.average} out of 5 from {reviews.count} review{reviews.count === 1 ? "" : "s"}</p>
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {reviews.items.map((r, i) => (
              <li key={i} className="card p-5">
                <p aria-label={`${r.rating} out of 5 stars`} className="text-brand">{"★".repeat(r.rating)}<span className="text-navy/20">{"★".repeat(5 - r.rating)}</span></p>
                <p className="mt-2 text-sm text-navy/80">{r.comment}</p>
                <p className="mt-3 text-sm font-semibold">{r.name}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
