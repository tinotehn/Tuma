import { allAmounts, normalizePhone, type Currency } from "../money";

export type Draft = { note?: string; commissionPct?: number; billerId?: string; category: string; amount: number; currency: Currency; payee: string; payeePhone?: string; rawText: string; modelAmount?: number };
export type Contact = { name: string; phone?: string | null };
export type Flag = { code: "ambiguous" | "velocity_daily" | "velocity_count" | "new_payee_cap" | "million" | "unusual" | "new_payee" | "similar" | "phone_mismatch" | "bad_phone" | "over_limit"; severity: "block" | "confirm" | "info"; data?: Record<string, any> };

const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
function lev(a: string, b: string) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return d[a.length][b.length]; }

export const limitFor = (c: Currency) => Number(c === "USD" ? process.env.MAX_TX_USD ?? 5000 : process.env.MAX_TX_ZWG ?? 150000);

/** Deterministic checks. The LLM never decides whether a payment is safe. */
export function checkDraft(d: Draft, ctx: { contacts: Contact[]; payeeHistory: number[]; allHistory: number[] }): Flag[] {
  const f: Flag[] = [];
  const typed = allAmounts(d.rawText);
  if (typed.length > 1 || (d.modelAmount != null && d.modelAmount !== d.amount)) f.push({ code: "ambiguous", severity: "block", data: { typed } });
  if (d.amount > limitFor(d.currency)) f.push({ code: "over_limit", severity: "block", data: { limit: limitFor(d.currency) } });
  if (d.amount >= 1_000_000) f.push({ code: "million", severity: "confirm" });
  if (d.payeePhone !== undefined && d.category === "send" && !normalizePhone(d.payeePhone)) f.push({ code: "bad_phone", severity: "block" });

  const base = ctx.payeeHistory.length >= 2 ? ctx.payeeHistory : ctx.allHistory.length >= 3 ? ctx.allHistory : [];
  if (base.length) { const m = median(base); if (m > 0 && (d.amount >= m * 10 || d.amount <= m / 10)) f.push({ code: "unusual", severity: "confirm", data: { typical: m, ratio: Math.round(d.amount / m * 10) / 10 } }); }

  const p = norm(d.payee); const exact = ctx.contacts.find(c => norm(c.name) === p);
  if (exact) {
    const sp = exact.phone && normalizePhone(exact.phone), ep = d.payeePhone && normalizePhone(d.payeePhone);
    if (sp && ep && sp !== ep) f.push({ code: "phone_mismatch", severity: "confirm", data: { saved: sp, entered: ep } });
  } else if (p) {
    const near = ctx.contacts.find(c => { const n = norm(c.name); return n.length > 2 && lev(n, p) <= Math.max(1, Math.floor(n.length / 4)); });
    if (near) f.push({ code: "similar", severity: "confirm", data: { match: near.name } });
    else f.push({ code: "new_payee", severity: "info" });
  }
  return f;
}
export const needsDigits = (fl: Flag[]) => fl.some(x => x.severity === "confirm");
export const isBlocked = (fl: Flag[]) => fl.some(x => x.severity === "block");
