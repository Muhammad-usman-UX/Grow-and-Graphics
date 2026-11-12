import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap py-24 text-center">
      <h1 className="text-4xl font-extrabold">Page not found</h1>
      <p className="mt-3 text-navy/70">That link does not lead anywhere. Check the address or head back home.</p>
      <Link href="/" className="btn btn-primary mt-6">Back to home</Link>
    </section>
  );
}
