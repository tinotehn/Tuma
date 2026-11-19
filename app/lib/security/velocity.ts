import type { Currency } from "../money";
import type { Flag } from "../bot/safety";
type Row = { amount: number | string; currency: string; status: string; created_at: string };
const num = (v: string | undefined, d: number) => (Number.isFinite(Number(v)) && v ? Number(v) : d);
export const caps = (c: Currency) => c === "USD"
  ? { daily: num(process.env.DAILY_CAP_USD, 10000), perHour: num(process.env.MAX_PAYMENTS_PER_HOUR, 10), newPayee: num(process.env.NEW_PAYEE_CAP_USD, 500) }
  : { daily: num(process.env.DAILY_CAP_ZWG, 250000), perHour: num(process.env.MAX_PAYMENTS_PER_HOUR, 10), newPayee: num(process.env.NEW_PAYEE_CAP_ZWG, 12500) };

/** Blocks account-takeover / runaway patterns: daily spend, payments per hour, big first payment to a new payee. */
export function checkVelocity(o: { amount: number; currency: Currency; history: Row[]; isNewPayee: boolean; now?: number }): Flag[] {
  const now = o.now ?? Date.now(), c = caps(o.currency), f: Flag[] = [];
  const live = o.history.filter(h => ["paid", "pending", "created", "sent", "awaiting delivery", "delivered"].includes(h.status.toLowerCase()) && h.currency === o.currency);
  const day = live.filter(h => now - new Date(h.created_at).getTime() < 864e5), hour = day.filter(h => now - new Date(h.created_at).getTime() < 36e5);
  const spent = day.reduce((s, h) => s + Number(h.amount), 0);
  if (spent + o.amount > c.daily) f.push({ code: "velocity_daily", severity: "block", data: { limit: c.daily, spent } });
  if (hour.length >= c.perHour) f.push({ code: "velocity_count", severity: "block", data: { limit: c.perHour } });
  if (o.isNewPayee && o.amount > c.newPayee) f.push({ code: "new_payee_cap", severity: "block", data: { limit: c.newPayee } });
  return f;
}
