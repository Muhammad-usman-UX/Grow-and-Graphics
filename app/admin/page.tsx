import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/supabase/server";
import { STATUS } from "@/lib/status";
import { PRODUCTS, isProductSlug } from "@/lib/products";
import { imageKeyMissing, imageProvider } from "@/lib/imageProvider";
import { emailEnabled } from "@/lib/email";
import { textProvider } from "@/lib/audit";

const FILTERS = ["All", ...Object.values(STATUS)];

export default async function AdminHome({ searchParams }: { searchParams: { status?: string } }) {
  if (!(await getAdminUser())) redirect("/admin/login");
  if (!isSupabaseConfigured()) return <p className="err">Supabase is not configured.</p>;

  const filter = FILTERS.includes(searchParams.status ?? "") && searchParams.status !== "All" ? searchParams.status : undefined;
  let q = getAdminClient().from("orders").select("id,product,client_name,client_email,status,created_at,revision_count").order("created_at", { ascending: false }).limit(200);
  if (filter) q = q.eq("status", filter);
  const { data: orders } = await q;
  const textKeyMissing = textProvider() !== "mock" && !process.env.TEXT_API_KEY;

  return (
    <>
      <h1 className="text-3xl font-extrabold">Orders</h1>
      <div className="mt-4 space-y-2 text-sm">
        {imageKeyMissing() && <p className="rounded-lg bg-amber-50 p-3 font-medium text-amber-900" role="alert">AI key not set. Images cannot be generated until IMAGE_API_KEY is added (or set IMAGE_PROVIDER=mock).</p>}
        {textKeyMissing && <p className="rounded-lg bg-amber-50 p-3 font-medium text-amber-900" role="alert">AI key not set for audits. Add TEXT_API_KEY (or set TEXT_PROVIDER=mock).</p>}
        <p className="text-navy/60">Image provider: <b>{imageProvider()}</b> · Audit text: <b>{textProvider()}</b> · Email: <b>{emailEnabled() ? "on" : "paused"}</b></p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Filter by status">
        {FILTERS.map((f) => {
          const on = (filter ?? "All") === f;
          return <Link key={f} href={f === "All" ? "/admin" : `/admin?status=${encodeURIComponent(f)}`} className={`rounded-full border px-3 py-1 text-xs font-semibold ${on ? "border-navy bg-navy text-white" : "border-navy/20"}`}>{f}</Link>;
        })}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-navy/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-navy-50 text-xs uppercase text-navy/60"><tr><th className="p-3">Date</th><th className="p-3">Client</th><th className="p-3">Product</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="border-t border-navy/10 hover:bg-navy-50">
                <td className="p-3 whitespace-nowrap">{new Date(o.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-dark underline">{o.client_name}</Link><br /><span className="text-xs text-navy/60">{o.client_email}</span></td>
                <td className="p-3">{isProductSlug(o.product) ? PRODUCTS[o.product].name : o.product}</td>
                <td className="p-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${o.status === STATUS.ADMIN_REVIEW ? "bg-amber-100 text-amber-900" : o.status === STATUS.FAILED ? "bg-red-100 text-red-800" : "bg-navy/10"}`}>{o.status}</span></td>
              </tr>
            ))}
            {!orders?.length && <tr><td colSpan={4} className="p-6 text-center text-navy/60">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
