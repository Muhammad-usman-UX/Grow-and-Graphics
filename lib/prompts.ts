import type { ProductSlug } from "./products";
import type { Task } from "./tasks";

export type Details = Record<string, string>;

/**
 * The base prompt contains ONLY what the client typed in Step 2. Admin can edit it ("Improve it").
 * Nothing about the business is invented here.
 */
export function buildBasePrompt(product: ProductSlug, d: Details, clientReply?: string | null): string {
  const L: string[] = [];
  const add = (label: string, v?: string) => { if (v && v.trim()) L.push(`${label}: ${v.trim()}`); };

  if (product === "logo-design") {
    L.push("Design a professional logo for this business.");
    add("Business name", d.business_name); add("Tagline", d.tagline); add("Industry", d.industry);
    add("Style", d.style); add("Brand colours", d.colours); add("The logo will be used on", d.usage);
    if (d.text_to_include) L.push(`Text to include exactly as written: "${d.text_to_include}"`);
    L.push("Use only the text listed above and spell it exactly. Flat vector look, plain white background, centered with generous margin, no mockup, no shadow, no gradient background.");
  } else if (product === "instagram-post") {
    L.push("Design an Instagram post.");
    add("Brand / business name", d.business_name); add("Headline (main text, spell exactly)", d.headline);
    add("The post is about", d.caption); add("Call to action text (spell exactly)", d.cta); add("Brand colours", d.colours); add("Format", d.size);
    L.push("Show the headline as the main text. Add the call to action if one is given. Do not add any other text. Keep important content away from the edges.");
  } else if (product === "facebook-banner") {
    L.push("Design a Facebook page cover banner.");
    add("Business name", d.business_name); add("Headline text (spell exactly)", d.headline);
    add("Subtext / tagline (spell exactly)", d.subtext); add("Brand colours", d.colours);
    L.push("Very wide panoramic banner, about 2.6 to 1. Keep all text and any logo inside the central horizontal band so nothing is cut off when cropped. Do not add any other text.");
  } else {
    L.push("Write a UI/UX audit report. Base it only on the facts below and on the page data supplied. Do not invent features or problems.");
    add("Website / app URL", d.site_url); add("App store link", d.app_store_url); add("To be audited", d.audit_scope);
    add("Specific page", d.specific_page_url); add("Main goal", d.main_goal); add("Reason for audit", d.reason);
    add("Main user flow to check", d.user_flow); add("Visitors / users", d.visitors);
    add("Problems already noticed", d.known_problems); add("Target users / customers", d.target_users);
  }
  if (clientReply) L.push(`Extra information the client sent later: ${clientReply}`);
  return L.join("\n");
}

const CONCEPTS = [
  "Concept 1, wordmark: the business name in distinctive custom lettering, with no separate symbol.",
  "Concept 2, symbol plus wordmark: one simple, memorable symbol beside the business name.",
  "Concept 3, monogram: stylised initials of the business name inside a clean shape, with the name beside or below.",
  "Concept 4, abstract emblem: one abstract geometric mark together with the business name.",
];

const VERSIONS = {
  primary: "Layout: the primary version. Symbol and name side by side (or the name alone for a wordmark).",
  stacked: "Layout: the stacked version. Symbol above the name, centered.",
  icon: "Layout: the icon version. The symbol or monogram alone with no text. For a wordmark concept use the first letter of the business name as the icon.",
};

export function taskPrompt(product: ProductSlug, task: Task, base: string, roundNote?: string | null, hasRef = false): string {
  const parts = [base];
  if (product === "logo-design" && task.concept && task.version) {
    parts.push(CONCEPTS[task.concept - 1], VERSIONS[task.version]);
    if (task.after) parts.push("The attached image is the approved primary logo for this concept. Recreate exactly the same logo (same symbol, lettering and colours) in the layout above.");
  } else if (hasRef) {
    parts.push("The attached image was supplied by the client. Use it as the logo or photo in the design, or as style reference.");
  }
  if (roundNote) parts.push(`Changes requested for this new version: ${roundNote}`);
  return parts.join("\n\n");
}
