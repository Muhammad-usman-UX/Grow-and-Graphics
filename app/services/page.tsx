import type { Metadata } from "next";
import Link from "next/link";
import { WORK } from "@/lib/site";

export const metadata: Metadata = { title: "Services", description: "Brand identity, websites, social content and growth marketing from Grow & Graphics." };

const SERVICES = [
  { t: "Brand identity", d: "Logo, colours, type and the rules that hold them together. We test everything at business-card size before we call it done.", items: ["Logo design", "Visual identity", "Brand guidelines", "Packaging"] },
  { t: "Websites", d: "Fast, clear sites that people can actually find their way around. Designed and built in-house, no hand-offs.", items: ["UX & UI design", "Development", "Landing pages", "Online stores"] },
  { t: "Social content", d: "Monthly content that looks like it came from one brand, not five freelancers. Templates included so you can post between drops.", items: ["Post design", "Campaigns", "Reels covers", "Ad creatives"] },
  { t: "Growth marketing", d: "The 'grow' half of our name. Ads, email and a bit of honest reporting so you know what's working.", items: ["Paid social", "Email design", "Analytics", "A/B testing"] },
];

const STEPS = [
  { t: "Chat", d: "A 30-minute call. We ask a lot of questions, you tell us what's been bugging you." },
  { t: "Proposal", d: "One page, fixed price, clear dates. If we're not the right fit we'll say so." },
  { t: "Make", d: "Weekly check-ins. You see work early and often — no big reveal moments." },
  { t: "Launch", d: "We hand over files you can actually use, then stick around for the first month." },
];

export default function Services() {
  return (
    <>
      <section className="wrap pt-16">
        <p className="eyebrow">Services</p>
        <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Design that earns its keep.</h1>
        <p className="mt-4 max-w-2xl text-lg text-navy/70">Pick one or bundle a few. Most clients start with a brand and come back for the website.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {SERVICES.map((s) => (
            <div key={s.t} className="card p-6">
              <h2 className="text-xl font-bold">{s.t}</h2>
              <p className="mt-2 text-sm text-navy/70">{s.d}</p>
              <ul className="mt-4 grid grid-cols-2 gap-y-1.5 text-sm font-medium">
                {s.items.map((i) => <li key={i} className="before:mr-2 before:text-brand before:content-['✓']">{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap mt-20">
        <h2 className="text-2xl font-extrabold">How a project runs</h2>
        <ol className="mt-6 grid gap-5 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} className="card p-5">
              <p className="text-xs font-semibold text-brand-dark">Step {i + 1}</p>
              <h3 className="mt-1 font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-navy/70">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap mt-20">
        <h2 className="text-2xl font-extrabold">Some of the work</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WORK.map((w) => (
            <figure key={w.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.img} alt={w.name} loading="lazy" className="aspect-[4/3] w-full rounded-xl bg-navy-100 object-cover" />
              <figcaption className="mt-3"><h3 className="font-bold">{w.name}</h3><p className="text-sm text-navy/60">{w.tag}</p></figcaption>
            </figure>
          ))}
        </div>
        <Link href="/contact" className="btn btn-primary mt-10">Talk to us</Link>
      </section>
    </>
  );
}
