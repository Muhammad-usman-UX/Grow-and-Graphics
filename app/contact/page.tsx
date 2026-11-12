import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Contact", description: "Tell Grow & Graphics about your project. We usually reply within a working day." };

export default function Contact() {
  return (
    <section className="wrap pt-16">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Tell us what you&rsquo;re working on.</h1>
      <p className="mt-4 max-w-2xl text-lg text-navy/70">A rough idea is plenty. We&rsquo;ll ask the right questions on a call. We usually reply within a working day.</p>
      <div className="mt-10 grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3"><ContactForm /></div>
        <aside className="space-y-6 md:col-span-2">
          <div><h2 className="text-sm font-semibold">Email</h2><a className="text-navy/80 underline" href={`mailto:${SITE.email}`}>{SITE.email}</a></div>
          <div><h2 className="text-sm font-semibold">WhatsApp</h2><a className="text-navy/80 underline" href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer">{SITE.whatsappDisplay}</a></div>
          <div><h2 className="text-sm font-semibold">Studio location</h2><p className="text-navy/80">{SITE.location}</p></div>
        </aside>
      </div>
    </section>
  );
}
