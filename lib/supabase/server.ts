import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/** Supabase client bound to the visitor's login cookies. Used only to check who the admin is. */
export function getAuthClient() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* called from a Server Component: middleware refreshes cookies */ }
      },
    },
  });
}

/** Returns the admin's email, or null. The ONLY admin is the account matching ADMIN_EMAIL. Checked in every admin page and API route. */
export async function getAdminUser(): Promise<string | null> {
  const admin = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!admin || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const { data } = await getAuthClient().auth.getUser();
  const email = data.user?.email?.toLowerCase();
  return email && email === admin ? email : null;
}
