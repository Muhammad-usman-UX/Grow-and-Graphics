import "server-only";
import dns from "node:dns/promises";
import net from "node:net";

export type PageResult = { ok: true; finalUrl: string; html: string } | { ok: false; reason: string };

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const x = ip.toLowerCase();
  return x === "::1" || x === "::" || x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe80") || x.startsWith("::ffff:");
}

async function assertPublic(host: string) {
  const addrs = await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("blocked address");
}

/** Fetches a public web page. Refuses private/internal addresses (SSRF protection) and caps size and time. */
export async function fetchPublicHtml(url: string): Promise<PageResult> {
  try {
    let current = url;
    for (let hop = 0; hop < 4; hop++) {
      const u = new URL(current);
      if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, reason: "Not a web address." };
      await assertPublic(u.hostname);
      const res = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(8000), headers: { "User-Agent": "GrowAndGraphicsAudit/1.0", Accept: "text/html" } });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        current = new URL(res.headers.get("location")!, u).toString();
        continue;
      }
      if (!res.ok) return { ok: false, reason: `The page answered with status ${res.status}.` };
      const reader = res.body?.getReader();
      if (!reader) return { ok: false, reason: "The page had no content." };
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (size < 1_500_000) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        size += value.length;
      }
      reader.cancel().catch(() => {});
      return { ok: true, finalUrl: current, html: Buffer.concat(chunks).toString("utf8") };
    }
    return { ok: false, reason: "Too many redirects." };
  } catch (e) {
    return { ok: false, reason: e instanceof Error && e.message === "blocked address" ? "That address is not allowed." : "The page could not be loaded." };
  }
}

export interface Finding { priority: "High" | "Medium" | "Low"; area: string; problem: string; fix: string }

const strip = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const all = (html: string, re: RegExp) => Array.from(html.matchAll(re)).map((m) => strip(m[1] ?? ""));

/** Free rule-based checks on the loaded HTML. These are facts, not opinions. */
export function analyzeHtml(html: string) {
  const title = strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const metaDesc = /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(html)?.[1] ?? "";
  const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const lang = /<html[^>]+lang=["'][^"']+["']/i.test(html);
  const h1 = all(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).filter(Boolean);
  const headings = all(html, /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi).filter(Boolean).slice(0, 12);
  const imgs = Array.from(html.matchAll(/<img\b[^>]*>/gi)).map((m) => m[0]);
  const noAlt = imgs.filter((t) => !/\balt\s*=/i.test(t)).length;
  const buttons = all(html, /<button[^>]*>([\s\S]*?)<\/button>/gi).filter(Boolean).slice(0, 12);
  const links = all(html, /<a\b[^>]*>([\s\S]*?)<\/a>/gi).filter(Boolean);
  const scripts = (html.match(/<script\b/gi) ?? []).length;
  const kb = Math.round(html.length / 1024);

  const findings: Finding[] = [];
  if (!viewport) findings.push({ priority: "High", area: "Mobile view", problem: "The page has no viewport tag, so it may not scale properly on phones.", fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the page head.' });
  if (h1.length === 0) findings.push({ priority: "High", area: "Homepage / structure", problem: "No main heading (h1) was found on the page.", fix: "Add one clear h1 that says what the page or business offers." });
  if (h1.length > 1) findings.push({ priority: "Low", area: "Structure", problem: `${h1.length} main headings (h1) were found.`, fix: "Use a single h1 and make the other headings h2 or h3." });
  if (!title) findings.push({ priority: "High", area: "Navigation / search", problem: "The page has no title.", fix: "Add a short, specific title tag (under 60 characters)." });
  else if (title.length > 65) findings.push({ priority: "Low", area: "Search", problem: `The page title is ${title.length} characters long.`, fix: "Shorten the title to about 60 characters so it is not cut off in search results." });
  if (!metaDesc) findings.push({ priority: "Medium", area: "Search", problem: "No meta description was found.", fix: "Add a 120 to 155 character description of the page." });
  if (noAlt > 0) findings.push({ priority: "Medium", area: "Accessibility", problem: `${noAlt} of ${imgs.length} images have no alt text.`, fix: "Add short alt text to every meaningful image and empty alt to decorative ones." });
  if (!lang) findings.push({ priority: "Low", area: "Accessibility", problem: "The html tag has no lang attribute.", fix: 'Add lang="en" (or the right language) to the html tag.' });
  if (kb > 400) findings.push({ priority: "Medium", area: "Speed", problem: `The page HTML alone is about ${kb} KB.`, fix: "Reduce inline content and defer or remove unneeded scripts." });
  if (scripts > 15) findings.push({ priority: "Medium", area: "Speed", problem: `${scripts} script tags were found.`, fix: "Combine, defer or remove scripts you do not need." });
  if (buttons.length === 0 && links.length < 3) findings.push({ priority: "Medium", area: "Navigation", problem: "Very few links or buttons were found in the loaded HTML.", fix: "Check that navigation is available without JavaScript, and that the main action is easy to find." });

  const snapshot = [`Title: ${title || "(none)"}`, `Meta description: ${metaDesc || "(none)"}`, `H1: ${h1.join(" | ") || "(none)"}`, `Other headings: ${headings.join(" | ") || "(none)"}`, `Buttons: ${buttons.join(" | ") || "(none)"}`, `Link texts: ${links.slice(0, 25).join(" | ")}`, `Images: ${imgs.length} (${noAlt} without alt). Scripts: ${scripts}. HTML size: ${kb} KB.`].join("\n");
  return { findings, snapshot };
}
