const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
const scales = ["","Thousand","Million","Billion"];
const chunk = (n: number) => { const p: string[] = []; if (n >= 100) { p.push(ones[Math.floor(n / 100)], "Hundred"); n %= 100; }
  if (n >= 20) p.push(tens[Math.floor(n / 10)] + (n % 10 ? "-" + ones[n % 10] : "")); else if (n > 0) p.push(ones[n]); return p.join(" "); };

export type Currency = "USD" | "ZWG";
export function toWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "Invalid amount";
  if (n === 0) return "Zero";
  let rest = Math.floor(n), i = 0; const cents = Math.round((n - rest) * 100); const parts: string[] = [];
  while (rest > 0 && i < scales.length) { const c = rest % 1000; if (c) parts.unshift(chunk(c) + (scales[i] ? " " + scales[i] : "")); rest = Math.floor(rest / 1000); i++; }
  return parts.join(" ") + (cents ? ` and ${chunk(cents)} Cents` : "");
}
export const fmtMoney = (n: number, c: Currency) => (c === "USD" ? "$" : "ZWG ") + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
export const wordsWithCurrency = (n: number, c: Currency) => `${toWords(n)} ${c === "USD" ? "US Dollars" : "Zimbabwe Gold"}`;

/** Every distinct amount typed in text (phone-like numbers ignored). More than one = ambiguous. */
export function allAmounts(text: string): number[] {
  const t = text.replace(/\b(?:order|ref(?:erence)?|invoice)\s*#?\s*[A-Za-z0-9-]+/gi, " ").replace(/\+?\d{9,}/g, " ");
  const out = new Set<number>();
  for (const m of t.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(k|m|million|thousand)?(?![a-z])/gi)) {
    let v = parseFloat(m[1].replace(/,/g, "")); const u = (m[2] || "").toLowerCase();
    if (u === "k" || u === "thousand") v *= 1e3; if (u === "m" || u === "million") v *= 1e6;
    if (Number.isFinite(v) && v > 0) out.add(v);
  }
  return [...out];
}
export const detectCurrency = (t: string): Currency => (/\b(zig|zwg|zwl)\b|zw\$/i.test(t) ? "ZWG" : "USD");

/** WhatsApp "263771234567" or "0771234567" -> "0771234567" ; null if not a Zimbabwe mobile. */
export function normalizePhone(p: string): string | null {
  const d = p.replace(/\D/g, "").replace(/^263/, "0");
  return /^07[1378]\d{7}$/.test(d) ? d : null;
}
export type Network = { name: "EcoCash" | "OneMoney" | "TeleCash"; method: "ecocash" | "onemoney" | "telecash"; fee: number };
export function detectNetwork(p: string): Network | null {
  const d = normalizePhone(p); if (!d) return null;
  if (/^07[78]/.test(d)) return { name: "EcoCash", method: "ecocash", fee: 0.02 };
  if (d.startsWith("071")) return { name: "OneMoney", method: "onemoney", fee: 0.015 };
  if (d.startsWith("073")) return { name: "TeleCash", method: "telecash", fee: 0.015 };
  return null;
}
