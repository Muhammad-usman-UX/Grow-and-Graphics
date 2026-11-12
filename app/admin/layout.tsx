import type { Metadata } from "next";
import Link from "next/link";
import { getAdminUser } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/AdminAuth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  return (
    <div className="wrap pt-8">
      {admin && (
        <nav className="mb-8 flex items-center gap-6 border-b border-navy/10 pb-4 text-sm font-semibold" aria-label="Admin">
          <Link href="/admin">Orders</Link>
          <Link href="/admin/reviews">Reviews</Link>
          <span className="ml-auto text-navy/50">{admin}</span>
          <LogoutButton />
        </nav>
      )}
      {children}
    </div>
  );
}
