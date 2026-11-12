import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/** Keeps the admin session fresh and sends visitors without an admin login to /admin/login. Pages and API routes check again themselves. */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isApi = request.nextUrl.pathname.startsWith("/api/");
  if (!url || !anon) return isApi ? NextResponse.json({ error: "Not configured." }, { status: 503 }) : NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  const isAdmin = Boolean(email && email === (process.env.ADMIN_EMAIL || "").trim().toLowerCase());

  if (request.nextUrl.pathname === "/admin/login") return response;
  if (!isAdmin) {
    if (isApi) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return response;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
