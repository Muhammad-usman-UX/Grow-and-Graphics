import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About", description: "Who we are, how we work and why we started Grow & Graphics." };

const BELIEFS = [
  { t: "Pretty isn't the goal", d: "If a design looks great and doesn't sell anything, we've failed. We'll always ask what it needs to do first." },
  { t: "Small team, on purpose", d: "You'll talk to the people doing the work. No account managers playing telephone." },
  { t: "Show early, show often", d: "Rough sketches in week one beat a polished surprise in week six." },
  { t: "Leave you independent", d: "Templates, guides and source files, so you're not stuck calling us for every Instagram post." },
];

export default function About() {
  return (
    <>
      <section className="wrap pt-16">
        <p className="eyebrow">About us</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">We started with one laptop and a client who couldn&rsquo;t afford an agency.</h1>
        <p className="mt-5 max-w-2xl text-lg text-navy/70">We&rsquo;re still small, still a bit stubborn, and still building brands for people who care how their business looks.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SITE.aboutImage} alt="Campaign posters in our studio" className="mt-10 aspect-[21/9] w-full rounded-2xl object-cover" />
      </section>

      <section className="wrap mt-16 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-extrabold">Why &ldquo;Grow&rdquo;?</h2>
          <p className="mt-3 text-navy/75">Because a nice logo on its own doesn&rsquo;t pay rent. We pair design with the practical stuff — ads, email, a website that converts — so the work keeps paying off after the launch post.</p>
        </div>
        <div className="space-y-4 text-navy/75">
          <p>Our clients are mostly founders, cafés, clinics and online shops. People who wear five hats and want one less thing to worry about.</p>
          <p>And yes, we&rsquo;re opening a shop. It&rsquo;s the templates and kits we&rsquo;ve made for ourselves over the years, tidied up so other people can use them too.</p>
        </div>
      </section>

      <section className="wrap mt-16">
        <h2 className="text-2xl font-extrabold">What we believe</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {BELIEFS.map((b) => (
            <div key={b.t} className="card p-6">
              <h3 className="font-bold">{b.t}</h3>
              <p className="mt-2 text-sm text-navy/70">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap mt-16 text-center">
        <h2 className="text-3xl font-extrabold">Sound like your kind of studio?</h2>
        <Link href="/contact" className="btn btn-primary mt-6">Say hello</Link>
      </section>
    </>
  );
}
