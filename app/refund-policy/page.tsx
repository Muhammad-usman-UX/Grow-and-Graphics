import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "No refund after final delivery; free regeneration or refund before delivery if something goes wrong.",
};

export default function Refund() {
  return (
    <section className="wrap max-w-3xl pt-16">
      <p className="eyebrow">The fine print</p>
      <h1 className="mt-3 text-4xl font-extrabold">Refund policy.</h1>
      <p className="mt-3 text-lg text-navy/70">Short and plain, the way it should be.</p>
      <ul className="mt-8 space-y-4 text-navy/85">
        <li className="card p-5">No refund once the final file has been generated and downloaded.</li>
        <li className="card p-5">If the AI generation fails or the file is wrong, we will regenerate it free, or refund you before delivery.</li>
        <li className="card p-5">2 free revisions are included with every product.</li>
      </ul>
      <p className="mt-8 text-navy/75">Questions? Email us at <a className="font-semibold text-brand-dark underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
    </section>
  );
}
