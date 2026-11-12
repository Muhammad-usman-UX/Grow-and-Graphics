import type { Metadata } from "next";
import { COMING_SOON, PRODUCT_LIST } from "@/lib/products";
import { ComingSoonCard, FreeProductCard } from "@/components/ProductCard";

export const metadata: Metadata = { title: "Shop", description: "Free launch offer: a logo, Instagram post, Facebook banner or UI/UX audit. Template kits coming soon." };

export default function Shop() {
  return (
    <section className="wrap pt-16">
      <p className="inline-block rounded-full bg-brand-mint px-3 py-1 text-sm font-semibold text-brand-dark">FREE — Launch Offer</p>
      <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Shop</h1>
      <p className="mt-4 max-w-2xl text-lg text-navy/70">
        Logo, post, banner or UI/UX audit — your first one is on us. The template kits stay Coming soon.
      </p>
      <p className="mt-2 text-sm text-navy/60">One free order per product for each email or WhatsApp number.</p>

      <h2 className="mt-12 text-2xl font-extrabold">Free right now</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PRODUCT_LIST.map((p) => <FreeProductCard key={p.slug} p={p} />)}
      </div>

      <h2 className="mt-14 text-2xl font-extrabold">Coming soon</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {COMING_SOON.map((p) => <ComingSoonCard key={p.slug} p={p} />)}
      </div>
    </section>
  );
}
