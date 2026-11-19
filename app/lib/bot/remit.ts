import { t } from "../i18n";
import { BANKS, findInstitution } from "../institutions";
import { fmtMoney, wordsWithCurrency, normalizePhone, type Currency } from "../money";
import { checkDraft, type Flag } from "./safety";
import * as S from "./store";
import { sendText, sendButtons } from "./whatsapp";
import { requestPayout, createPayLink } from "./payout";
import { onSettlementResult } from "./settlement";
import { computeFees, remitCommission, remitInCommission } from "../security/fees";

export const PLATFORMS = /\b(youtube|tiktok|facebook|instagram|twitch|twitter|snapchat|patreon|spotify)\b/i;
export const RECEIVE = /\b(receive|remittance|diaspora|creator|payout|tambira|amukela)\b/i;
const rand = (n: number) => Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
const last4 = (a: string) => a.slice(-4);
const bankName = (id: string) => findInstitution(id)?.name ?? id;

/** Bank + account number from free text. Phone numbers are never mistaken for accounts. */
export function parseDestination(text: string, defaultBank?: string | null) {
  const bank = BANKS.find(b => new RegExp(`\\b${b.id}\\b|${b.name.split(" ")[0]}`, "i").test(text)) ?? (defaultBank ? findInstitution(defaultBank) : undefined);
  const account = (text.match(/\b\d{9,16}\b/g) ?? []).find(n => !normalizePhone(n));
  return { bank: bank && bank.kind === "bank" ? bank : undefined, account };
}

// ---- Receiving (creators + diaspora): register where money should land, get a code to quote ----
export async function startReceive(wa: string, l: string, user: any, text: string) {
  const platform = text.match(PLATFORMS)?.[1]?.toLowerCase();
  const { bank, account } = parseDestination(text, user.institution);
  if (!bank) return sendText(wa, t(l, "recv_need_bank"));
  if (!account) return sendText(wa, t(l, "recv_need_account", { bank: bank.name }));
  const token = rand(8);
  await S.setSession(wa, { state: "recv", token, profile: { purpose: platform ? "creator" : "diaspora", platform: platform ?? null, bank: bank.id, account } });
  return sendButtons(wa, t(l, "recv_card", { bank: bank.name, account, purpose: platform ? `Creator (${platform})` : "Diaspora" }) + (remitInCommission().pct > 0 ? "\n" + t(l, "recv_fee", { pct: remitInCommission().pct }) : ""),
    [{ id: `y:${token}`, title: t(l, "btn_yes") }, { id: `n:${token}`, title: t(l, "btn_no") }]);
}
export async function confirmReceive(wa: string, l: string, s: any) {
  const code = "TM" + rand(6);
  await S.clearSession(wa);
  await S.createProfile({ code, wa_id: wa, ...s.profile });
  return sendText(wa, t(l, "recv_ready", { code, bank: bankName(s.profile.bank), last4: last4(s.profile.account) }) + (process.env.REMIT_RECEIVE_INSTRUCTIONS ? "\n" + process.env.REMIT_RECEIVE_INSTRUCTIONS : ""));
}

// ---- Partner webhooks: funds arrived -> pay out to the bank account -> tell the recipient ----
export async function onFunds(e: { reference: string; code: string; amount: number; currency: string; senderName?: string; senderCountry?: string }) {
  if (!(e.amount > 0) || !["USD", "ZWG"].includes(e.currency)) return "bad_event";
  const p = await S.findProfile(e.code); if (!p) return "unknown_code";
  const { commission, netToPayee } = computeFees(e.amount, null, remitInCommission());
  const fresh = await S.insertRemittance({ reference: e.reference, direction: "in", code: p.code, recipient_wa: p.wa_id, bank: p.bank, account: p.account, source_name: e.senderName ?? null,
    source_country: e.senderCountry ?? null, platform: p.platform, purpose: p.purpose, amount: e.amount, commission, currency: e.currency, status: "received" });
  if (!fresh) return "duplicate";
  const l = (await S.getUser(p.wa_id))?.language ?? "en";
  const r = await requestPayout({ reference: e.reference, bank: p.bank, account: p.account, amount: netToPayee, currency: e.currency });
  await S.updateRemittance(e.reference, r.status === "sent" ? "payout_sent" : "payout_queued", r.ref);
  await sendText(p.wa_id, t(l, commission > 0 ? "remit_in_fee" : "remit_in", { fee: fmtMoney(commission, e.currency as Currency), net: fmtMoney(netToPayee, e.currency as Currency), amount: fmtMoney(e.amount, e.currency as Currency), from: e.senderName ?? e.senderCountry ?? p.platform ?? "sender", bank: bankName(p.bank), last4: last4(p.account) }));
  return "ok";
}
export async function onPayout(e: { reference: string; status: "paid" | "failed" }) {
  if (e.reference.startsWith("STL-")) return onSettlementResult(e); // collector settlement, not a remittance
  const row = await S.updateRemittance(e.reference, e.status === "paid" ? "paid_out" : "payout_failed"); if (!row) return "unknown_ref";
  const to = row.recipient_wa ?? row.sender_wa; // outbound (diaspora) transfers have no recipient WhatsApp: tell the sender
  const l = (await S.getUser(to))?.language ?? "en";
  await sendText(to, t(l, e.status === "paid" ? (row.direction === "out" ? "remit_sent_done" : "remit_done") : "remit_failed", { name: row.source_name ?? "", amount: fmtMoney(Number(row.amount), row.currency), bank: bankName(row.bank), last4: last4(row.account), ref: row.reference }));
  return "ok";
}

// ---- Diaspora sender (non-Zimbabwean WhatsApp number): send to a Zimbabwe bank account ----
export const REMIT_LIMIT_USD = () => Number(process.env.MAX_REMIT_USD ?? 2000);
export async function startOut(wa: string, l: string, text: string, p: { amount?: number; currency: Currency; payee: string; modelAmount?: number }) {
  const { bank, account } = parseDestination(text);
  if (p.amount == null) return sendText(wa, t(l, "need_amount"));
  const payee = bank ? p.payee.replace(new RegExp(`\\b(${bank.id}|${bank.name.split(" ")[0]})\\b`, "i"), "").trim() : p.payee;
  if (!payee || !bank || !account) return sendText(wa, t(l, "remit_need_dest"));
  const draft = { category: "remit", amount: p.amount, currency: "USD" as Currency, payee, rawText: text, modelAmount: p.modelAmount };
  const flags: Flag[] = checkDraft(draft, { contacts: [], payeeHistory: [], allHistory: [] }).filter(f => f.code !== "new_payee");
  const block = flags.find(f => f.severity === "block");
  if (block) return sendText(wa, t(l, block.code, { typed: (block.data?.typed ?? []).join(", "), limit: block.data?.limit ?? "", digits: p.amount.toLocaleString("en-US"), words: wordsWithCurrency(p.amount, "USD").toUpperCase() }));
  if (p.amount > REMIT_LIMIT_USD()) return sendText(wa, t(l, "over_limit", { limit: REMIT_LIMIT_USD(), digits: p.amount.toLocaleString("en-US"), words: wordsWithCurrency(p.amount, "USD").toUpperCase() }));
  const token = rand(8);
  const { commission, serviceFee, total, netToPayee } = computeFees(p.amount, null, remitCommission());
  const feeLines = serviceFee > 0 ? [`${t(l, "service_fee")}: ${fmtMoney(serviceFee, "USD")}`, `${t(l, "total")}: ${fmtMoney(total, "USD")}`] : commission > 0 ? [`${t(l, "remit_net")}: ${fmtMoney(netToPayee, "USD")}`] : [];
  await S.setSession(wa, { state: "out", token, draft: { ...draft, bank: bank.id, account } });
  return sendButtons(wa, [t(l, "head"), `${t(l, "amount")}: ${fmtMoney(p.amount, "USD")} (${wordsWithCurrency(p.amount, "USD")})`, `${t(l, "to")}: ${payee}`, `${bank.name} · ${account}`, ...feeLines, t(l, "remit_check")].join("\n"),
    [{ id: `y:${token}`, title: t(l, "btn_yes") }, { id: `n:${token}`, title: t(l, "btn_no") }]);
}
export async function finishOut(wa: string, l: string, d: any) {
  const reference = "TUMA-R" + Date.now().toString(36).toUpperCase() + rand(3);
  await S.clearSession(wa);
  const { commission, serviceFee, total, netToPayee } = computeFees(d.amount, null, remitCommission()); // recomputed here, never trusted from the session
  await S.insertRemittance({ reference, direction: "out", sender_wa: wa, source_name: d.payee, bank: d.bank, account: d.account, amount: d.amount, commission, service_fee: serviceFee, total_charged: total, currency: d.currency, status: "requested" });
  const url = await createPayLink({ reference, amount: total, payoutAmount: netToPayee, currency: d.currency, senderWa: wa }); // collect `total`, deliver `payoutAmount`
  return sendText(wa, url ? t(l, "remit_pay", { url, ref: reference }) : t(l, "remit_unavailable", { ref: reference }));
}
