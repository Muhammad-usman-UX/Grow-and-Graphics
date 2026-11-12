import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CheckoutFlow from "@/components/CheckoutFlow";
import { PRODUCTS, isProductSlug } from "@/lib/products";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { STATUS } from "@/lib/status";
import { isUuid } from "@/lib/forms";

export const metadata: Metadata = { title: "Get it free", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Checkout({ params, searchParams }: { params: { product: string }; searchParams: { order?: string } }) {
  if (!isProductSlug(params.product)) notFound();
  const p = PRODUCTS[params.product];

  // Returning to finish Step 2 from the order page: ?order=<uuid>
  let initialOrderId: string | undefined;
  const o = searchParams.order;
  if (o && isUuid(o) && isSupabaseConfigured()) {
    const { data } = await getAdminClient().from("orders").select("id,product,status").eq("id", o).maybeSingle();
    if (data && data.product === p.slug && data.status === STATUS.CONFIRMED) initialOrderId = data.id;
  }

  return (
    <section className="wrap pt-14">
      <Link href={`/shop/${p.slug}`} className="text-sm font-semibold text-brand-dark">Back to {p.name}</Link>
      <h1 className="mb-8 mt-3 text-3xl font-extrabold">{p.name} — Free Launch Offer</h1>
      <CheckoutFlow product={p.slug} productName={p.name} initialOrderId={initialOrderId} />
    </section>
  );
}
