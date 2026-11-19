// Pays collected money (net of TUMA's commission) out to the landlord's / shop owner's registered bank account.
// Safety: new or changed accounts are held (SETTLEMENT_HOLD_HOURS), payments settle only after SETTLEMENT_DELAY_HOURS (dispute window),
// payments are claimed atomically (never settled twice), tiny balances wait for SETTLEMENT_MIN_*, a failed payout pauses the account.
import * as S from "./store";
import { requestPayout } from "./payout";
import { sendText } from "./whatsapp";
import { t } from "../i18n";
import { fmtMoney, type Currency } from "../money";
import { findInstitution } from "../institutions";

const num = (v: string | undefined, d: number) => (v !== undefined && v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : d);
export const settlementConfig = () => ({ holdH: num(process.env.SETTLEMENT_HOLD_HOURS, 24), delayH: num(process.env.SETTLEMENT_DELAY_HOURS, 24), min: { USD: num(process.env.SETTLEMENT_MIN_USD, 5), ZWG: num(process.env.SETTLEMENT_MIN_ZWG, 125) } as Record<string, number> });
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const bankName = (id?: string | null) => (id ? findInstitution(id)?.name ?? id : "");
const rid = () => Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();

export async function runSettlement(now = Date.now()) {
  const c = settlementConfig(), out = { collectors: 0, settlements: 0, held: 0, belowMin: 0, errors: 0 }, seen = new Set<string>();
  for (const col of await S.collectorsWithAccount()) {
    if (seen.has(col.wa_id)) continue; seen.add(col.wa_id); out.collectors++;
    if (col.settlement_paused || !col.bank || !col.account || now - new Date(col.account_set_at ?? now).getTime() < c.holdH * 36e5) { out.held++; continue; }
    try {
      const cutoff = new Date(now - c.delayH * 36e5).toISOString(), sums: Record<string, number> = {};
      for (const r of await S.eligiblePayments(col.wa_id, cutoff)) sums[r.currency] = (sums[r.currency] ?? 0) + Number(r.amount) - Number(r.commission ?? 0);
      for (const [cur, sum] of Object.entries(sums)) {
        if (!(cur in c.min)) continue;
        if (r2(sum) < c.min[cur]) { out.belowMin++; continue; }
        const reference = `STL-${rid()}-${cur}`, claimed = await S.claimPayments(col.wa_id, reference, cutoff, cur);
        if (!claimed.length) continue; // another run got there first
        const gross = r2(claimed.reduce((s, r) => s + Number(r.amount), 0)), commission = r2(claimed.reduce((s, r) => s + Number(r.commission ?? 0), 0)), net = r2(gross - commission);
        try {
          await S.createSettlement({ reference, wa_id: col.wa_id, bank: col.bank, account: col.account, currency: cur, gross, commission, net, payments: claimed.length, status: "queued" });
          const r = await requestPayout({ reference, bank: col.bank, account: col.account, amount: net, currency: cur });
          await S.updateSettlement(reference, r.status === "sent" ? "sent" : "queued", r.ref);
          const l = (await S.getUser(col.wa_id))?.language ?? "en";
          await sendText(col.wa_id, t(l, "settle_started", { net: fmtMoney(net, cur as Currency), bank: bankName(col.bank), last4: col.account.slice(-4), n: claimed.length, ref: reference }));
          out.settlements++;
        } catch (e) { await S.releasePayments(reference); await S.updateSettlement(reference, "failed"); throw e; }
      }
    } catch (e) { out.errors++; console.error("settlement", col.wa_id, (e as Error).message); }
  }
  return out;
}

/** Partner callback for a settlement payout (reference starts with STL-). */
export async function onSettlementResult(e: { reference: string; status: "paid" | "failed" }) {
  const row = await S.updateSettlement(e.reference, e.status === "paid" ? "paid_out" : "failed"); if (!row) return "unknown_ref";
  const l = (await S.getUser(row.wa_id))?.language ?? "en", vars = { net: fmtMoney(Number(row.net), row.currency), bank: bankName(row.bank), last4: String(row.account).slice(-4), n: row.payments, ref: row.reference };
  if (e.status === "paid") await sendText(row.wa_id, t(l, "settle_done", vars));
  else { await S.releasePayments(row.reference); await S.pauseSettlement(row.wa_id); await sendText(row.wa_id, t(l, "settle_failed", vars)); } // money stays owed; account paused until the owner re-confirms it
  return "ok";
}
