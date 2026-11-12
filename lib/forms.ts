import type { ProductSlug } from "./products";

export type FieldType = "text" | "textarea" | "select" | "multiselect" | "colours" | "url" | "date" | "file";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  help?: string;
  /** Show (and require) this field only when another multiselect/select contains this value. */
  showIf?: { field: string; includes: string };
}

export const MAX_FILE_BYTES = 3 * 1024 * 1024; // Vercel serverless request bodies are capped at about 4.5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];

const INDUSTRIES = ["Food", "Fashion", "Beauty", "Tech", "Education", "Health", "Real Estate", "Retail", "Services", "Other"];

export const FORMS: Record<ProductSlug, FieldDef[]> = {
  "logo-design": [
    { name: "business_name", label: "Business name", type: "text", required: true },
    { name: "tagline", label: "Tagline", type: "text" },
    { name: "industry", label: "Industry", type: "select", required: true, options: INDUSTRIES },
    { name: "colours", label: "Colours", type: "colours", required: true, placeholder: "e.g. navy #0F2A4A, green" },
    { name: "style", label: "Style", type: "select", required: true, options: ["Modern", "Minimal", "Luxury", "Playful", "Bold"] },
    { name: "usage", label: "Where will the logo be used?", type: "select", required: true, options: ["Website", "Instagram/Facebook", "Shop sign", "Print", "Packaging", "Other"] },
    { name: "text_to_include", label: "Text to include", type: "text" },
    { name: "reference_file", label: "Upload current logo or reference", type: "file", help: "JPG or PNG, up to 3 MB" },
  ],
  "instagram-post": [
    { name: "business_name", label: "Brand / business name", type: "text", required: true },
    { name: "headline", label: "Headline / main text", type: "text", required: true },
    { name: "caption", label: "Caption / offer", type: "textarea", required: true },
    { name: "colours", label: "Colours", type: "colours", required: true, placeholder: "e.g. white, orange #F28C28" },
    { name: "size", label: "Size", type: "select", required: true, options: ["1080x1080 Square", "1080x1920 Story"] },
    { name: "date_needed", label: "Date needed", type: "date" },
    { name: "cta", label: "Call to action text", type: "text", placeholder: "e.g. Order today" },
    { name: "upload_file", label: "Upload logo or photo", type: "file", help: "JPG or PNG, up to 3 MB" },
  ],
  "facebook-banner": [
    { name: "business_name", label: "Business name", type: "text", required: true },
    { name: "headline", label: "Headline text", type: "text", required: true },
    { name: "subtext", label: "Subtext / tagline", type: "text" },
    { name: "colours", label: "Colours", type: "colours", required: true, placeholder: "e.g. navy, white" },
    { name: "upload_file", label: "Upload logo or photo", type: "file", help: "JPG or PNG, up to 3 MB" },
  ],
  "ui-ux-audit": [
    { name: "site_url", label: "Website / App URL", type: "url", required: true, placeholder: "https://example.com" },
    { name: "app_store_url", label: "App store link", type: "url" },
    { name: "audit_scope", label: "What should be audited?", type: "multiselect", required: true, options: ["Homepage", "Product page", "Checkout", "Mobile view", "Full site", "Specific page"] },
    { name: "specific_page_url", label: "Which page URL?", type: "url", required: true, showIf: { field: "audit_scope", includes: "Specific page" } },
    { name: "main_goal", label: "Main goal", type: "select", required: true, options: ["More sales", "More signups", "Easier navigation", "Faster site", "Better look", "Other"] },
    { name: "reason", label: "Reason for audit", type: "textarea", required: true },
    { name: "user_flow", label: "Main user flow to check", type: "textarea", required: true, placeholder: "e.g. Visitor lands on home, picks a product, pays" },
    { name: "visitors", label: "Who are your visitors / users?", type: "text", required: true },
    { name: "known_problems", label: "Problems you already noticed", type: "textarea" },
    { name: "target_users", label: "Target users / customers", type: "text" },
  ],
};

export type FormValues = Record<string, string | string[]>;

export function isVisible(f: FieldDef, values: FormValues): boolean {
  if (!f.showIf) return true;
  const v = values[f.showIf.field];
  return Array.isArray(v) ? v.includes(f.showIf.includes) : v === f.showIf.includes;
}

const HOST_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

export function normalizeUrl(v: string): string {
  const t = v.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/** A real public web address. Rejects localhost, raw IPs and non-http schemes. */
export function isRealUrl(v: string): boolean {
  try {
    const u = new URL(normalizeUrl(v));
    return (u.protocol === "http:" || u.protocol === "https:") && HOST_RE.test(u.hostname) && !IPV4_RE.test(u.hostname);
  } catch {
    return false;
  }
}

/** Returns a map of field name to error message. Empty object means valid. File fields are checked separately. */
export function validateDetails(product: ProductSlug, values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of FORMS[product]) {
    if (f.type === "file" || !isVisible(f, values)) continue;
    const raw = values[f.name];
    const val = Array.isArray(raw) ? raw : (raw ?? "").toString().trim();
    const empty = Array.isArray(val) ? val.length === 0 : val === "";

    if (empty) {
      if (f.required) errors[f.name] = f.type === "multiselect" ? "Choose at least one option." : "This field is required.";
      continue;
    }
    if (f.type === "select" && f.options && !f.options.includes(val as string)) errors[f.name] = "Choose one of the options.";
    else if (f.type === "multiselect" && f.options && (val as string[]).some((x) => !f.options!.includes(x))) errors[f.name] = "Choose from the options shown.";
    else if (f.type === "url" && !isRealUrl(val as string)) errors[f.name] = "Enter a real web address, like https://example.com";
    else if (f.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(val as string)) errors[f.name] = "Enter a valid date.";
    else if (f.type === "colours" && (val as string).length < 2) errors[f.name] = "Tell us your colours.";
    else if ((f.type === "text" || f.type === "textarea") && (val as string).length > 2000) errors[f.name] = "Please keep this under 2000 characters.";
  }
  return errors;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Digits only. A leading 0 is treated as Pakistan (92). Used to enforce one free order per number. */
export function normalizeWhatsapp(v: string): string {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "92" + d.slice(1);
  return d;
}

export function validateContact(v: { name: string; email: string; whatsapp: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (v.name.trim().length < 2) e.name = "Enter your full name.";
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email address.";
  const n = normalizeWhatsapp(v.whatsapp);
  if (n.length < 10 || n.length > 15) e.whatsapp = "Enter a valid WhatsApp number with country code.";
  return e;
}

export function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** Check the first bytes so a renamed file cannot pass as an image. */
export function sniffImage(bytes: Uint8Array): "image/jpeg" | "image/png" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  return null;
}
