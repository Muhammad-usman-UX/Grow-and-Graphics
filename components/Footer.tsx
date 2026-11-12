import Link from "next/link";
import { NAV, SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-24 bg-navy text-white">
      <div className="wrap grid gap-10 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5 font-bold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SITE.logoIcon} alt="" width={32} height={32} className="h-8 w-8" />
            Grow &amp; Graphics
          </div>
          <p className="mt-4 max-w-xs text-sm text-white/70">
            A small design studio. We make brands look like they mean it, and sell a few of the tools we use along the way.
          </p>
          <div className="mt-4 flex gap-5 text-sm">
            <Link href="/refund-policy" className="text-white/80 hover:text-white">Refund policy</Link>
            <a href={SITE.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white">Review us on Google</a>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Studio</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {NAV.map((n) => (
              <li key={n.href}><Link href={n.href} className="text-white/70 hover:text-white">{n.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Say hello</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li><a href={`mailto:${SITE.email}`} className="hover:text-white">{SITE.email}</a></li>
            <li><a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp: {SITE.whatsappDisplay}</a></li>
            <li>{SITE.location}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Grow &amp; Graphics. Design services, delivered fast.
      </div>
    </footer>
  );
}
