// ONE place that decides what the user pays and what TUMA earns. Always computed server-side from the network + commission rules,
// never from message text, so the confirm card, the Paynow charge and the ledger can never disagree.
import type { Network } from "../money";
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type CommissionSpec = { pct: number; payer: "sender" | "payee" };
const pctFrom = (v: string | undefined, dflt: number) => { const n = v === undefined || v.trim() === "" ? dflt : Number(v); return Number.isFinite(n) && n >= 0 && n <= 10 ? n : dflt; }; // a typo can never charge 200%
/** Commission on person-to-person sends. Default 2%, charged ON TOP to the sender and shown on the card as "Service fee".
 *  SEND_COMMISSION_PCT=0 turns it off; SEND_COMMISSION_PAYER=payee takes it out of what the recipient gets instead. */
export const sendCommission = (): CommissionSpec => ({ pct: pctFrom(process.env.SEND_COMMISSION_PCT, 2), payer: process.env.SEND_COMMISSION_PAYER === "payee" ? "payee" : "sender" });
/** Diaspora sender -> Zimbabwe bank account. Default 2% on top (REMIT_COMMISSION_PCT, REMIT_COMMISSION_PAYER). */
export const remitCommission = (): CommissionSpec => ({ pct: pctFrom(process.env.REMIT_COMMISSION_PCT, 2), payer: process.env.REMIT_COMMISSION_PAYER === "payee" ? "payee" : "sender" });
/** Money arriving for a registered recipient (creators / partner-initiated). Default 0 = off; if enabled it is deducted from the payout and disclosed. */
export const remitInCommission = (): CommissionSpec => ({ pct: pctFrom(process.env.REMIT_IN_COMMISSION_PCT, 0), payer: "payee" });

/** commission: a number = biller-style (taken from the payee side), or a spec. */
export function computeFees(amount: number, network: Network | null, commission: number | CommissionSpec = 0) {
  const spec: CommissionSpec = typeof commission === "number" ? { pct: commission, payer: "payee" } : commission;
  const fee = r2(amount * (network?.fee ?? 0));            // wallet network fee, charged to the payer
  const comm = r2(amount * spec.pct / 100);                // TUMA revenue
  const serviceFee = spec.payer === "sender" ? comm : 0;   // the part of it the payer sees and pays
  return { fee, commission: comm, serviceFee, total: r2(amount + fee + serviceFee), netToPayee: spec.payer === "payee" ? r2(amount - comm) : amount };
}
