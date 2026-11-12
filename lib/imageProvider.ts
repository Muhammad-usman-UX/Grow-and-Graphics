import "server-only";
import sharp from "sharp";

export type Aspect = "square" | "portrait" | "wide";

export interface MockSpec {
  layout: "primary" | "stacked" | "icon" | "card";
  title: string;
  subtitle?: string;
  badge: string;
  colours: string[];
  width: number;
  height: number;
}

export interface ImageReq {
  prompt: string;
  aspect: Aspect;
  reference?: { bytes: Buffer; mime: string };
  mock: MockSpec;
}

export type ImageProviderName = "mock" | "gemini" | "openai";

export function imageProvider(): ImageProviderName {
  const p = (process.env.IMAGE_PROVIDER || "mock").toLowerCase();
  return p === "gemini" || p === "openai" ? p : "mock";
}

/** True when a real provider is selected but no key is set. Admin shows "AI key not set". */
export function imageKeyMissing(): boolean {
  return imageProvider() !== "mock" && !process.env.IMAGE_API_KEY;
}

const TIMEOUT = 35_000;

export async function generateImage(req: ImageReq): Promise<Buffer> {
  const p = imageProvider();
  if (p === "mock") return mockImage(req.mock);
  const key = process.env.IMAGE_API_KEY;
  if (!key) throw new Error("AI key not set. Add IMAGE_API_KEY (or set IMAGE_PROVIDER=mock).");
  return p === "gemini" ? viaGemini(req, key) : viaOpenAI(req, key);
}

async function viaGemini(req: ImageReq, key: string): Promise<Buffer> {
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const parts: Record<string, unknown>[] = [{ text: req.prompt }];
  if (req.reference) parts.push({ inlineData: { mimeType: req.reference.mime, data: req.reference.bytes.toString("base64") } });
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE", "TEXT"] } }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`Gemini image error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const outParts: { inlineData?: { data?: string }; inline_data?: { data?: string } }[] = json.candidates?.[0]?.content?.parts ?? [];
  const data = outParts.map((x) => x.inlineData?.data ?? x.inline_data?.data).find(Boolean);
  if (!data) throw new Error("Gemini returned no image (the request may have been blocked or the free quota used up).");
  return Buffer.from(data, "base64");
}

async function viaOpenAI(req: ImageReq, key: string): Promise<Buffer> {
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
  const size = req.aspect === "square" ? "1024x1024" : req.aspect === "portrait" ? "1024x1536" : "1536x1024";
  const quality = process.env.IMAGE_QUALITY || "medium";
  let res: Response;
  if (req.reference) {
    const fd = new FormData();
    fd.append("model", model);
    fd.append("prompt", req.prompt);
    fd.append("size", size);
    fd.append("quality", quality);
    fd.append("image", new Blob([new Uint8Array(req.reference.bytes)], { type: req.reference.mime }), "reference.png");
    res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: fd, signal: AbortSignal.timeout(TIMEOUT) });
  } else {
    res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: req.prompt, size, quality, n: 1 }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
  }
  if (!res.ok) throw new Error(`OpenAI image error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image.");
  return Buffer.from(b64, "base64");
}

/* ---------- Post-processing (all providers) ---------- */

/** Exact output size. Logos use "contain" so nothing is cropped; posts and banners use "cover". */
export async function finishImage(src: Buffer, w: number, h: number, fit: "cover" | "contain") {
  const base = () => sharp(src).resize(w, h, { fit, position: "centre", background: "#ffffff" });
  const png = await base().flatten({ background: "#ffffff" }).png().toBuffer();
  const jpg = await base().flatten({ background: "#ffffff" }).jpeg({ quality: 92 }).toBuffer();
  return { png, jpg };
}

/** Turns the plain white background transparent. Approximate: works best on clean flat logos. */
export async function transparentPng(png: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const m = Math.min(data[i], data[i + 1], data[i + 2]);
    if (m >= 248) data[i + 3] = 0;
    else if (m >= 232) data[i + 3] = Math.round(((248 - m) / 16) * 255);
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

/* ---------- Mock provider: free placeholder images so the whole flow can be tested ---------- */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

async function mockImage(s: MockSpec): Promise<Buffer> {
  const [c1, c2 = "#2BB673"] = s.colours;
  const { width: W, height: H } = s;
  const font = `font-family="Arial, Helvetica, DejaVu Sans, sans-serif"`;
  let body = "";

  if (s.layout === "card") {
    const fs = Math.round(Math.min(W, H) * (H < 400 ? 0.2 : 0.085));
    const lines = wrap(s.title, Math.max(10, Math.floor(W / (fs * 0.55))));
    const y0 = H / 2 - ((lines.length - 1) * fs * 1.1) / 2;
    body = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
${lines.map((l, i) => `<text x="${W / 2}" y="${y0 + i * fs * 1.1}" text-anchor="middle" ${font} font-weight="800" font-size="${fs}" fill="#fff">${esc(l)}</text>`).join("")}
${s.subtitle ? `<text x="${W / 2}" y="${y0 + lines.length * fs * 1.1 + fs * 0.3}" text-anchor="middle" ${font} font-size="${Math.round(fs * 0.45)}" fill="#fff" opacity="0.9">${esc(s.subtitle.slice(0, 60))}</text>` : ""}
<text x="${W / 2}" y="${H - Math.round(H * 0.04)}" text-anchor="middle" ${font} font-size="${Math.max(12, Math.round(H * 0.022))}" fill="#fff" opacity="0.7">${esc(s.badge)}</text>`;
  } else {
    const initial = esc((s.title.trim()[0] || "G").toUpperCase());
    const mark = (cx: number, cy: number, r: number) =>
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c1}"/><text x="${cx}" y="${cy + r * 0.36}" text-anchor="middle" ${font} font-weight="800" font-size="${r * 1.1}" fill="#fff">${initial}</text>`;
    const name = (x: number, y: number, size: number, anchor: string) =>
      `<text x="${x}" y="${y}" text-anchor="${anchor}" ${font} font-weight="800" font-size="${size}" fill="${c1}">${esc(s.title.slice(0, 22))}</text>`;
    if (s.layout === "icon") body = mark(W / 2, H / 2, W * 0.28);
    else if (s.layout === "stacked") body = mark(W / 2, H * 0.38, W * 0.17) + name(W / 2, H * 0.72, W * 0.09, "middle");
    else body = mark(W * 0.2, H / 2, W * 0.11) + name(W * 0.34, H / 2 + W * 0.03, W * 0.085, "start");
    body += `<text x="${W / 2}" y="${H - 28}" text-anchor="middle" ${font} font-size="22" fill="${c2}">${esc(s.badge)}</text>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s.layout === "card" ? "" : `<rect width="${W}" height="${H}" fill="#fff"/>`}${body}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
