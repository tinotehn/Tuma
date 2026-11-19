// Landlords and shop owners who COLLECT money through TUMA. They register on WhatsApp, get a code, and payers quote it:
//   "Pay rent $150 code LL7K2PX house FLAT4B"  /  "Pay shop $12 code SH4M9QA order 881"
import * as S from "./store";
import { t } from "../i18n";
import { fmtMoney, type Currency } from "../money";
import { getBiller, findBiller } from "../billers";
import { findMerchant } from "../merchants";
import { isSafeName, sanitizeInput } from "../security/validate";
import { sendText, sendButtons } from "./whatsapp";
import { parseDestination } from "./remit";
import { settlementConfig, bankName } from "./settlement";

export type Kind = "landlord" | "shop";
export const KINDS: Record<Kind, { category: string; biller: string; unit: string }> = { landlord: { category: "rent", biller: "rent", unit: "house" }, shop: { category: "shopping", biller: "shopping", unit: "order" } };
/** LL/SH + 5 chars, at least one digit (so ordinary words like "shelter" are never mistaken for a code). */
export const COLLECTOR_CODE = /\b(?:LL|SH)(?=[A-Z2-9]*\d)[A-Z2-9]{5}\b/i;
export const collectorPct = (k: Kind) => getBiller(KINDS[k].biller)?.commissionPct ?? 0;
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newCode(kind: Kind) { let c = ""; do { c = (kind === "landlord" ? "LL" : "SH") + Array.from({ length: 5 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join(""); } while (!/\d/.test(c.slice(2))); return c; }
const send = sendText;

export async function registerCollector(wa: string, l: string, profileName: string | null, kind: Kind, rawName: string) {
  const mine = (await S.collectorsOf(wa)).find(c => c.kind === kind);
  const view = (c: { name: string; code: string }) => t(l, "register_ok", { kind: t(l, "k_" + kind), name: c.name, code: c.code, pct: collectorPct(kind), example: kind === "landlord" ? `Pay rent $150 code ${c.code} house FLAT4B` : `Pay shop $12 code ${c.code} order 881` });
  if (mine) return send(wa, view(mine)); // one profile per kind per number: re-registering just shows the code again
  const name = sanitizeInput(rawName || profileName || "", 40);
  // Names are shown to payers on the confirm card, so block anything that impersonates a biller or merchant.
  if (!name || !isSafeName(name) || findBiller(name) || findMerchant(name)) return send(wa, t(l, "collector_bad_name"));
  const code = newCode(kind); await S.createCollector({ code, wa_id: wa, kind, name });
  return send(wa, view({ name, code }));
}

type Row = { amount: number | string; commission?: number | string | null; currency: string; collector_unit?: string | null; created_at: string };
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export function summarizeCollected(rows: Row[], now = Date.now()) {
  const win = (days: number) => { const by: Record<string, { count: number; gross: number; net: number }> = {};
    for (const r of rows) { if (new Date(r.created_at).getTime() < now - days * 864e5) continue; const o = (by[r.currency] ??= { count: 0, gross: 0, net: 0 }); o.count++; o.gross += Number(r.amount); o.net += Number(r.amount) - Number(r.commission ?? 0); } return by; };
  const units: Record<string, { count: number; gross: number; currency: string }> = {};
  for (const r of rows) { const k = `${r.collector_unit ?? "(no unit)"}|${r.currency}`; const o = (units[k] ??= { count: 0, gross: 0, currency: r.currency }); o.count++; o.gross += Number(r.amount); }
  return { today: win(1), week: win(7), month: win(30), units: Object.entries(units).map(([k, v]) => ({ unit: k.split("|")[0], ...v })).sort((a, b) => b.gross - a.gross).slice(0, 5) };
}
export async function collectedReport(wa: string, l: string, now = Date.now()) {
  const mine = await S.collectorsOf(wa); if (!mine.length) return t(l, "collected_none");
  const [rows, uns, stl] = await Promise.all([S.collectedFor(wa, 30), S.unsettledFor(wa), S.settlementsOf(wa, 30)]), s = summarizeCollected(rows, now);
  const sum = (xs: { currency: string; v: number }[]) => { const by: Record<string, number> = {}; for (const x of xs) by[x.currency] = (by[x.currency] ?? 0) + x.v; return Object.entries(by).map(([c, v]) => fmtMoney(r2(v), c as Currency)).join(" | "); };
  const awaiting = sum(uns.map(u => ({ currency: u.currency, v: Number(u.amount) - Number(u.commission ?? 0) }))), settled = sum(stl.map(x => ({ currency: x.currency, v: Number(x.net) }))), acct = mine.find(c => c.account);
  const line = (by: Record<string, { count: number; gross: number; net: number }>) => Object.keys(by).length ? Object.entries(by).map(([c, o]) => `${fmtMoney(r2(o.gross), c as Currency)} (${o.count}) · after fee ${fmtMoney(r2(o.net), c as Currency)}`).join(" | ") : t(l, "collected_empty");
  return [`💰 ${mine.map(c => `${t(l, "k_" + c.kind)} ${c.name}: *${c.code}*`).join("\n")}`, `\n*${t(l, "today")}*: ${line(s.today)}`, `*7*: ${line(s.week)}`, `*30*: ${line(s.month)}`,
    ...(s.units.length ? ["\n" + s.units.map(u => `• ${u.unit}: ${fmtMoney(r2(u.gross), u.currency as Currency)} (${u.count})`).join("\n")] : []),
    "", acct ? t(l, "collected_account", { bank: bankName(acct.bank), last4: String(acct.account).slice(-4) }) + (acct.settlement_paused ? " " + t(l, "settle_paused") : "") : t(l, "collected_no_account"),
    ...(awaiting ? [t(l, "collected_awaiting", { amount: awaiting })] : []), ...(settled ? [t(l, "collected_settled", { amount: settled })] : [])].join("\n");
}

// ---- settlement account ("settle to CBZ 1234567890123") ----
const rand = (n: number) => Array.from({ length: n }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");
export async function startSettle(wa: string, l: string, user: { institution?: string | null }, text: string) {
  const mine = await S.collectorsOf(wa); if (!mine.length) return send(wa, t(l, "collected_none"));
  const { bank, account } = parseDestination(text, user.institution), typed = /\d{9,16}/.test(text) || /\b(cbz|steward|zb|fbc|stanbic|ecobank|bancabc|nmb|nedbank)\b/i.test(text);
  const cur = mine.find(c => c.account);
  if (!typed) return send(wa, cur ? t(l, "settle_status", { bank: bankName(cur.bank), last4: String(cur.account).slice(-4), paused: cur.settlement_paused ? t(l, "settle_paused") : "" }) : t(l, "settle_need_bank"));
  if (!bank) return send(wa, t(l, "settle_need_bank"));
  if (!account) return send(wa, t(l, "settle_need_account", { bank: bank.name }));
  const token = rand(8); await S.setSession(wa, { state: "settle", token, bank: bank.id, account });
  return sendButtons(wa, t(l, "settle_card", { bank: bank.name, account, hours: settlementConfig().holdH }), [{ id: `y:${token}`, title: t(l, "btn_yes") }, { id: `n:${token}`, title: t(l, "btn_no") }]);
}
export async function confirmSettle(wa: string, l: string, s: { bank: string; account: string }) {
  await S.clearSession(wa); await S.setSettlementAccount(wa, s.bank, s.account);
  return send(wa, t(l, "settle_ok", { bank: bankName(s.bank), last4: s.account.slice(-4), hours: settlementConfig().holdH }));
}
