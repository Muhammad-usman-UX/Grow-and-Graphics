import "server-only";
import { Resend } from "resend";

const SITE_URL = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Emails stay paused until RESEND_API_KEY is set. Returns true only if an email was really sent. */
export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

async function send(to: string, subject: string, html: string): Promise<boolean> {
  if (!emailEnabled()) return false;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: process.env.EMAIL_FROM || "Grow and Graphics <onboarding@resend.dev>", to, subject, html });
    if (error) { console.error("email failed", error.message); return false; }
    return true;
  } catch (e) {
    console.error("email failed", e);
    return false;
  }
}

export function sendDraftReady(o: { id: string; client_name: string; client_email: string; productName: string }) {
  const link = `${SITE_URL()}/order/${o.id}`;
  return send(o.client_email, "Your first draft is ready to review - Grow and Graphics",
    `<p>Hi ${esc(o.client_name)},</p><p>Your free <b>${esc(o.productName)}</b> first draft is ready to review.</p><p><a href="${link}">Open your private order page</a></p><p>Grow and Graphics</p>`);
}

export function sendFollowup(o: { id: string; client_name: string; client_email: string }, googleUrl: string) {
  return send(o.client_email, "How was your free design? Leave us a Google review",
    `<p>Hi ${esc(o.client_name)},</p><p>We hope you love your design. If you do, a quick Google review helps a small studio a lot:</p><p><a href="${googleUrl}">Review Grow and Graphics on Google</a></p><p>Your order page: <a href="${SITE_URL()}/order/${o.id}">${SITE_URL()}/order/${o.id}</a></p><p>Thank you!</p>`);
}
