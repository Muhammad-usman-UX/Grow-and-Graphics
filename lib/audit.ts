import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { analyzeHtml, fetchPublicHtml, type Finding } from "./fetchPage";
import type { Details } from "./prompts";

export interface AuditReport {
  url: string;
  pageLoaded: boolean;
  pageNote: string;
  summary: string;
  problems: Finding[];
  quickWins: string[];
}

const ORDER = { High: 0, Medium: 1, Low: 2 } as const;

export function textProvider(): "mock" | "gemini" | "openai" {
  const p = (process.env.TEXT_PROVIDER || "mock").toLowerCase();
  return p === "gemini" || p === "openai" ? p : "mock";
}

const SYSTEM = `You are a careful UI/UX reviewer. Use ONLY the client's answers and the page data supplied. Never invent features, numbers or problems that the data does not support. If the page data is missing, say so and base the report on the client's answers only. Return JSON only: {"summary": string, "problems": [{"priority":"High"|"Medium"|"Low","area":string,"problem":string,"fix":string}], "quickWins": [string]}. Keep each item to one or two sentences. Maximum 10 problems.`;

async function askModel(prompt: string): Promise<string> {
  const key = process.env.TEXT_API_KEY;
  if (!key) throw new Error("AI key not set. Add TEXT_API_KEY (or set TEXT_PROVIDER=mock).");
  if (textProvider() === "gemini") {
    const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
      signal: AbortSignal.timeout(40_000),
    });
    if (!res.ok) throw new Error(`Gemini text error ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const j = await res.json();
    return j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(40_000),
  });
  if (!res.ok) throw new Error(`OpenAI text error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content ?? "";
}

export async function buildAuditReport(d: Details, basePrompt: string, roundNote?: string | null): Promise<AuditReport> {
  const target = d.specific_page_url || d.site_url;
  const page = await fetchPublicHtml(target);
  const checks = page.ok ? analyzeHtml(page.html) : { findings: [] as Finding[], snapshot: "" };

  const report: AuditReport = {
    url: target,
    pageLoaded: page.ok,
    pageNote: page.ok ? "Automatic checks ran on the HTML this address returned. They cannot judge visual design, or pages that need a login or build their content with JavaScript." : `The page could not be loaded (${page.ok ? "" : page.reason}) so this report relies on your answers only.`,
    summary: `Audit of ${target}. Main goal: ${d.main_goal}. ${page.ok ? `${checks.findings.length} issue(s) were found by automatic checks.` : "No automatic page checks were possible."}`,
    problems: [...checks.findings],
    quickWins: checks.findings.filter((f) => f.priority !== "Low").slice(0, 3).map((f) => f.fix),
  };

  if (textProvider() !== "mock") {
    const prompt = [basePrompt, roundNote ? `Changes requested: ${roundNote}` : "", page.ok ? `PAGE DATA (from the live page):\n${checks.snapshot}\n\nAUTOMATIC CHECKS:\n${checks.findings.map((f) => `- [${f.priority}] ${f.area}: ${f.problem}`).join("\n") || "none"}` : "PAGE DATA: not available."].filter(Boolean).join("\n\n");
    const raw = await askModel(prompt);
    try {
      const j = JSON.parse(raw.replace(/^```json|```$/g, "").trim());
      const problems: Finding[] = (Array.isArray(j.problems) ? j.problems : [])
        .filter((p: Finding) => p && p.problem && p.fix && p.priority in ORDER)
        .slice(0, 12);
      if (problems.length) report.problems = problems;
      if (typeof j.summary === "string" && j.summary) report.summary = j.summary;
      if (Array.isArray(j.quickWins)) report.quickWins = j.quickWins.filter((x: unknown) => typeof x === "string").slice(0, 5);
    } catch {
      /* model did not return valid JSON: keep the rule-based report */
    }
  }
  report.problems.sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
  return report;
}

/* ---------- PDF ---------- */

function safe(font: PDFFont, s: string): string {
  const set = new Set(font.getCharacterSet());
  return Array.from(s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, "-"))
    .map((ch) => (ch === "\n" || set.has(ch.codePointAt(0)!) ? ch : "?"))
    .join("");
}

function wrapLines(font: PDFFont, text: string, size: number, width: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const t = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(t, size) > width && line) { out.push(line); line = word; } else line = t;
    }
    out.push(line);
  }
  return out;
}

export async function auditToPdf(r: AuditReport, d: Details): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595, H = 842, M = 50, CW = W - M * 2;
  let page = pdf.addPage([W, H]);
  let y = H - M;

  const need = (h: number) => { if (y - h < M) { page = pdf.addPage([W, H]); y = H - M; } };
  const para = (text: string, size = 10.5, font = reg, color = rgb(0.1, 0.16, 0.25), indent = 0, gap = 4) => {
    for (const l of wrapLines(font, safe(font, text), size, CW - indent)) {
      need(size + 4);
      page.drawText(l, { x: M + indent, y: y - size, size, font, color });
      y -= size + 4;
    }
    y -= gap;
  };

  page.drawRectangle({ x: 0, y: H - 110, width: W, height: 110, color: rgb(0.06, 0.16, 0.29) });
  page.drawText("UI/UX Audit Report", { x: M, y: H - 60, size: 26, font: bold, color: rgb(1, 1, 1) });
  page.drawText(safe(reg, `${r.url}  |  ${new Date().toISOString().slice(0, 10)}`), { x: M, y: H - 84, size: 11, font: reg, color: rgb(0.8, 0.9, 0.85) });
  y = H - 140;

  para("Summary", 15, bold); para(r.summary);
  para("What you asked us to check", 15, bold);
  for (const [k, v] of [["Audit scope", d.audit_scope], ["Main goal", d.main_goal], ["Reason", d.reason], ["User flow", d.user_flow], ["Visitors", d.visitors], ["Problems you noticed", d.known_problems], ["Target users", d.target_users]] as const) {
    if (v) para(`${k}: ${v}`, 10, reg, rgb(0.1, 0.16, 0.25), 0, 2);
  }
  y -= 8;
  para("Problems and fixes, in priority order", 15, bold);
  if (!r.problems.length) para("No problems were detected by the checks that could be run.");
  const col = { High: rgb(0.75, 0.15, 0.15), Medium: rgb(0.85, 0.5, 0.05), Low: rgb(0.2, 0.5, 0.35) } as const;
  r.problems.forEach((p, i) => {
    need(60);
    para(`${i + 1}. [${p.priority}] ${p.area}`, 11, bold, col[p.priority], 0, 1);
    para(`Problem: ${p.problem}`, 10.5, reg, rgb(0.1, 0.16, 0.25), 12, 1);
    para(`Fix: ${p.fix}`, 10.5, reg, rgb(0.1, 0.16, 0.25), 12, 8);
  });
  if (r.quickWins.length) { para("Quick wins", 15, bold); r.quickWins.forEach((q) => para(`- ${q}`, 10.5, reg, rgb(0.1, 0.16, 0.25), 8, 2)); y -= 6; }
  para("About this report", 12, bold); para(r.pageNote, 9.5, reg, rgb(0.35, 0.42, 0.5));
  return pdf.save();
}
