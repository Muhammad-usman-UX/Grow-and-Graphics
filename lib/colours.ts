const NAMED: Record<string, string> = {
  navy: "#0F2A4A", blue: "#2563EB", green: "#2BB673", red: "#DC2626", orange: "#F28C28", yellow: "#F5C518",
  purple: "#7C3AED", pink: "#EC4899", black: "#111111", white: "#FFFFFF", grey: "#6B7280", gray: "#6B7280",
  teal: "#0D9488", gold: "#C9A227", brown: "#7B4B2A", maroon: "#7F1D1D", cyan: "#06B6D4",
};

/** Pull up to three hex colours out of free text like "navy #0F2A4A, green". Used for mock images only. */
export function parseColours(text: string): string[] {
  const out: string[] = [];
  for (const m of text.match(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b|[a-z]+/gi) ?? []) {
    const k = m.toLowerCase();
    let hex: string | undefined;
    if (k.startsWith("#")) hex = k.length === 4 ? `#${k[1]}${k[1]}${k[2]}${k[2]}${k[3]}${k[3]}` : k;
    else hex = NAMED[k];
    if (hex && !out.includes(hex.toUpperCase())) out.push(hex.toUpperCase());
  }
  return out.length ? out.slice(0, 3) : ["#0F2A4A", "#2BB673"];
}
