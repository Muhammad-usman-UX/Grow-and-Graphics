import Link from "next/link";
import { NAV, SITE } from "@/lib/site";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/95 backdrop-blur">
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-navy">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SITE.logoIcon} alt="" width={32} height={32} className="h-8 w-8" />
          <span>Grow &amp; Graphics</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-medium text-navy/80 hover:text-navy">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/contact" className="btn btn-primary hidden sm:inline-flex">Start a project</Link>
          {/* Mobile menu: plain <details>, no JavaScript needed */}
          <details className="relative md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-navy/20" aria-label="Menu">
              <span aria-hidden className="text-lg leading-none">☰</span>
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-navy/10 bg-white p-2 shadow-lg">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-navy-50">{n.label}</Link>
              ))}
              <Link href="/contact" className="btn btn-primary mt-2 w-full">Start a project</Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
