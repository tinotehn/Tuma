import * as S from "./store";
import { fmtMoney, type Currency } from "../money";

/** Owner numbers (comma-separated WhatsApp ids in ADMIN_WA). Only they can use the "profit" command. */
export const isAdmin = (wa: string) => (process.env.ADMIN_WA ?? "").split(",").map(s => s.trim()).filter(Boolean).includes(wa);

type Pay = { amount: number | string; fee?: number | string | null; commission?: number | string | null; currency: string; status: string; created_at: string };
type Rem = { commission?: number | string | null; currency: string; created_at: string };
type Ev = { code: string; amount: number | string; currency: string; created_at: string };
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function summarize(pay: Pay[], ev: Ev[], days: number, now = Date.now(), rem: Rem[] = []) {
  const since = now - days * 864e5, by: Record<string, { paid: number; volume: number; fees: number; commission: number; failed: number; remitCommission: number }> = {};
  for (const p of pay) {
    if (new Date(p.created_at).getTime() < since) continue;
    const o = (by[p.currency] ??= { paid: 0, volume: 0, fees: 0, commission: 0, failed: 0, remitCommission: 0 }), st = p.status.toLowerCase();
    if (st === "paid") { o.paid++; o.volume += Number(p.amount); o.fees += Number(p.fee ?? 0); o.commission += Number(p.commission ?? 0); }
    else if (["failed", "cancelled", "disputed"].includes(st)) o.failed++;
  }
  for (const r of rem) { if (new Date(r.created_at).getTime() < since) continue; (by[r.currency] ??= { paid: 0, volume: 0, fees: 0, commission: 0, failed: 0, remitCommission: 0 }).remitCommission += Number(r.commission ?? 0); }
  const stopped = { count: 0, value: {} as Record<string, number>, warned: 0 };
  for (const e of ev) {
    if (new Date(e.created_at).getTime() < since) continue;
    if (e.code.startsWith("flagged:")) stopped.warned++; else { stopped.count++; stopped.value[e.currency] = (stopped.value[e.currency] ?? 0) + Number(e.amount); }
  }
  return { by, stopped };
}

export async function profitReport(now = Date.now()) {
  const [pay, ev, rem] = await Promise.all([S.paymentsSince(30), S.securityEventsSince(30), S.remittancesSince(30)]);
  const lines = ["📊 TUMA report"];
  for (const [label, days] of [["Today", 1], ["7 days", 7], ["30 days", 30]] as const) {
    const { by, stopped } = summarize(pay, ev, days, now, rem), cur = Object.keys(by);
    lines.push(`\n*${label}*`);
    if (!cur.length) lines.push("No payments");
    for (const c of cur) { const o = by[c]; lines.push(`${c}: ${o.paid} paid · volume ${fmtMoney(r2(o.volume), c as Currency)} · commission ${fmtMoney(r2(o.commission), c as Currency)} · fees ${fmtMoney(r2(o.fees), c as Currency)}${o.remitCommission ? ` · remittance commission ${fmtMoney(r2(o.remitCommission), c as Currency)}` : ""} · failed ${o.failed}`); }
    lines.push(`Safety: ${stopped.count} stopped${Object.entries(stopped.value).map(([c, v]) => ` (${fmtMoney(r2(v), c as Currency)})`).join("")} · ${stopped.warned} warnings shown`);
  }
  lines.push("\nCommission = your revenue from billers. Fees = wallet charges collected from users. Paynow/wallet costs are NOT deducted here.");
  return lines.join("\n");
}
