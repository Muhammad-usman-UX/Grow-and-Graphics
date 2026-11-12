import Link from "next/link";
import type { ComingSoon, Product } from "@/lib/products";

export function FreeProductCard({ p }: { p: Product }) {
  return (
    <article className="card flex flex-col p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{p.name}</h3>
        {p.badge && <span className="rounded-full bg-brand-mint px-2.5 py-0.5 text-xs font-semibold text-brand-dark">{p.badge}</span>}
      </div>
      <p className="mt-2 text-sm text-navy/70">{p.blurb}</p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-xl font-extrabold text-brand-dark">FREE</span>
        <span className="text-xs font-semibold text-navy/60">Launch Offer</span>
        {p.oldPrice && <s className="text-sm text-navy/50">{p.oldPrice}</s>}
      </div>
      <p className="mt-1 text-xs text-navy/60">{p.delivery} · {p.revisions}</p>
      <div className="mt-5 flex gap-3">
        <Link href={`/checkout/${p.slug}`} className="btn btn-primary flex-1">Get It Free</Link>
        <Link href={`/shop/${p.slug}`} className="btn btn-ghost">Details</Link>
      </div>
    </article>
  );
}

export function ComingSoonCard({ p }: { p: ComingSoon }) {
  return (
    <article className="card flex flex-col bg-navy-50 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{p.name}</h3>
        <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-semibold">Coming soon</span>
      </div>
      <p className="mt-2 text-sm text-navy/70">{p.blurb}</p>
      <p className="mt-4 text-xs font-medium text-navy/60">{p.category}</p>
    </article>
  );
}
