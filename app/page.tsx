import Link from "next/link";
import { SITE, WORK } from "@/lib/site";
import { COMING_SOON, PRODUCT_LIST } from "@/lib/products";
import { ComingSoonCard, FreeProductCard } from "@/components/ProductCard";
import { getReviewSummary } from "@/lib/reviews";

export const revalidate = 60;

const SERVICES = [
  { t: "Brand identity", d: "Logo, colours, type and the rules that hold them together. We test everything at business-card size before we call it done." },
  { t: "Websites", d: "Fast, clear sites that people can actually find their way around. Designed and built in-house, no hand-offs." },
  { t: "Social content", d: "Monthly content that looks like it came from one brand, not five freelancers. Templates included so you can post between drops." },
  { t: "Growth marketing", d: "The 'grow' half of our name. Ads, email and a bit of honest reporting so you know what's working." },
];

export default async function Home() {
  const reviews = await getReviewSummary();
  return (
    <>
      <section className="bg-navy text-white">
        <div className="wrap grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm font-semibold text-brand">Design studio</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">Good design should pay for itself.</h1>
            <p className="mt-5 max-w-lg text-lg text-white/75">
              We&rsquo;re a small team making brands, websites and social content for businesses that are ready to be taken seriously. No fluff decks. Just work that moves the numbers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/services" className="btn btn-primary">Explore our work</Link>
              <Link href="/shop" className="btn border border-white/30 text-white hover:bg-white/10">Explore products</Link>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
              {[["20", "recent projects"], ["38", "repeat clients"], ["6", "people, 1 studio"]].map(([n, l]) => (
                <div key={l}>
                  <dt className="text-3xl font-extrabold text-brand">{n}</dt>
                  <dd className="mt-1 text-xs text-white/70">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SITE.heroImage} alt="Brand identity work laid out on a desk" className="aspect-[4/3] w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="wrap mt-20">
        <p className="eyebrow">From the shop — free launch</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold">Tools from our own toolbox</h2>
            <p className="mt-2 max-w-xl text-navy/70">Start with a free logo, Instagram post, Facebook banner or UI/UX audit. Templates and kits are coming soon.</p>
          </div>
          <Link href="/shop" className="btn btn-ghost">See everything</Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_LIST.map((p) => <FreeProductCard key={p.slug} p={p} />)}
          {COMING_SOON.slice(0, 2).map((p) => <ComingSoonCard key={p.slug} p={p} />)}
        </div>
      </section>

      <section className="wrap mt-24">
        <p className="eyebrow">What we do</p>
        <h2 className="mt-2 text-3xl font-extrabold">Four things, done properly.</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {SERVICES.map((s) => (
            <div key={s.t} className="card p-6">
              <h3 className="text-lg font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-navy/70">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap mt-24">
        <p className="eyebrow">Selected work</p>
        <h2 className="mt-2 text-3xl font-extrabold">Recent projects</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WORK.map((w) => (
            <figure key={w.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.img} alt={w.name} loading="lazy" className="aspect-[4/3] w-full rounded-xl bg-navy-100 object-cover" />
              <figcaption className="mt-3">
                <h3 className="font-bold">{w.name}</h3>
                <p className="text-sm text-navy/60">{w.tag}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="wrap mt-24">
        <p className="eyebrow">How we think</p>
        <blockquote className="mt-3 max-w-3xl text-2xl font-semibold leading-snug sm:text-3xl">
          &ldquo;Most small businesses don&rsquo;t need a 60-page strategy. They need a logo that works on a van, a site that loads fast, and someone who picks up the phone.&rdquo;
        </blockquote>
        <p className="mt-4 font-medium text-navy/70">— {SITE.founder}, founder</p>
        <Link href="/about" className="btn btn-ghost mt-6">More about us</Link>
      </section>

      <section className="wrap mt-24">
        <div className="card flex flex-wrap items-center justify-between gap-5 bg-navy-50 p-8">
          <div>
            <h2 className="text-2xl font-extrabold">Customer reviews</h2>
            {reviews.count > 0 ? (
              <p className="mt-1 text-navy/70">{reviews.average} out of 5 from {reviews.count} approved review{reviews.count === 1 ? "" : "s"}.</p>
            ) : (
              <p className="mt-1 text-navy/70">Be one of our first free clients and tell us how we did.</p>
            )}
          </div>
          <a href={SITE.googleProfileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Rated on Google</a>
        </div>
        {reviews.items.length > 0 && (
          <ul className="mt-5 grid gap-5 md:grid-cols-3">
            {reviews.items.slice(0, 3).map((r, i) => (
              <li key={i} className="card p-5">
                <p aria-label={`${r.rating} out of 5 stars`} className="text-brand">{"★".repeat(r.rating)}<span className="text-navy/20">{"★".repeat(5 - r.rating)}</span></p>
                <p className="mt-2 text-sm text-navy/80">{r.comment}</p>
                <p className="mt-3 text-sm font-semibold">{r.name}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="wrap mt-24">
        <div className="rounded-3xl bg-navy px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-extrabold">Got a project in mind? Let&rsquo;s grow it.</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/75">We usually reply within a working day. Tell us roughly what you need — we&rsquo;ll figure out the rest together.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn btn-primary">Get in touch</Link>
            <Link href="/shop" className="btn border border-white/30 text-white hover:bg-white/10">Browse the shop</Link>
          </div>
        </div>
      </section>
    </>
  );
}
