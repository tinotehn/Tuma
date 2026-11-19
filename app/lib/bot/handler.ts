import { t, langMenu, LANGS, FULL_LANGS, KEYWORDS, type Lang } from "../i18n";
import { fmtMoney, wordsWithCurrency, detectNetwork, normalizePhone } from "../money";
import { checkDraft, needsDigits, type Flag } from "./safety";
import { parseMessage } from "./gemini";
import * as S from "./store";
import { sendText, sendButtons } from "./whatsapp";
import { findInstitution } from "../institutions";
import { findMerchant, extractNote } from "../merchants";
import { RECEIVE, startReceive, confirmReceive, startOut, finishOut } from "./remit";
import { initiate } from "./paynow";

const CAT = (l: string, c: string) => t(l, "c_" + c);
const ref = () => "TUMA-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

function flagLines(l: string, d: any, flags: Flag[]) {
  const digits = d.amount.toLocaleString("en-US"), words = wordsWithCurrency(d.amount, d.currency).toUpperCase();
  return flags.map(f => f.code === "million" ? t(l, "warn_million", { digits, words }) : f.code === "unusual" ? t(l, "warn_unusual", { ...f.data, typical: fmtMoney(f.data!.typical, d.currency) })
    : f.code === "similar" ? t(l, "warn_similar", { match: f.data!.match, payee: d.payee }) : f.code === "phone_mismatch" ? t(l, "warn_phone", { payee: d.payee, ...f.data })
    : f.code === "new_payee" ? t(l, "new_payee", { payee: d.payee }) : "").filter(Boolean);
}

export async function handleText(wa: string, profileName: string | null, text: string) {
  text = text.trim().slice(0, 300);
  let user = await S.getUser(wa);
  const parsed = await parseMessage(text);
  const merchant = findMerchant(text);
  if (merchant) Object.assign(parsed, { intent: "pay", category: merchant.kind, payee: merchant.name, payeePhone: undefined });
  if (!user) { const l = FULL_LANGS.includes(parsed.lang as Lang) ? parsed.lang! : "en"; await S.upsertUser(wa, profileName, l); user = { wa_id: wa, name: profileName, language: l }; await sendText(wa, t(l, "welcome")); if (parsed.intent !== "pay") return; }
  const l = user.language; const session = await S.getSession(wa);

  if (session?.state === "lang" && /^\d{1,2}$/.test(text)) {
    const pick = LANGS[Number(text) - 1]; if (!pick) return sendText(wa, t(l, "error"));
    await S.upsertUser(wa, user.name, pick.id); await S.clearSession(wa);
    return sendText(wa, t(pick.id, "lang_set", { name: pick.name }) + (FULL_LANGS.includes(pick.id) ? "" : "\n" + t("en", "lang_fallback", { name: pick.name })));
  }
  const lk = text.match(KEYWORDS.link);
  if (lk) { const inst = findInstitution(lk[1]); if (!inst) return sendText(wa, t(l, "unknown")); await S.setInstitution(wa, inst.id); return sendText(wa, t(l, "linked", { name: inst.name })); }
  if (KEYWORDS.language.test(text)) { await S.setSession(wa, { state: "lang" }); return sendText(wa, t(l, "lang_menu", { list: langMenu() })); }
  if (KEYWORDS.cancel.test(text)) { await S.clearSession(wa); return sendText(wa, t(l, "cancelled")); }
  if (KEYWORDS.history.test(text)) { const h = (await S.history(wa)).slice(0, 5);
    return sendText(wa, h.length ? t(l, "hist_head") + "\n" + h.map(p => `• ${fmtMoney(Number(p.amount), p.currency)} → ${p.payee_name} (${p.status})`).join("\n") : t(l, "hist_empty")); }

  if (session?.state === "digits") { // second confirmation for flagged payments: user must retype the exact amount
    const typed = text.replace(/[^\d.]/g, "");
    if (Number(typed) === session.draft.amount && typed.length) return session.kind === "out" ? finishOut(wa, l, session.draft) : execute(wa, l, session.draft);
    await S.clearSession(wa); return sendText(wa, t(l, "retype_wrong"));
  }
  if (RECEIVE.test(text) && !merchant) return startReceive(wa, l, user, text);
  if (KEYWORDS.help.test(text) && parsed.intent !== "pay") return sendText(wa, t(l, "welcome"));
  if (parsed.intent !== "pay") return sendText(wa, t(l, "unknown"));

  if (!normalizePhone(wa)) return startOut(wa, l, text, parsed); // diaspora sender
  if (parsed.amount == null) return sendText(wa, t(l, "need_amount"));
  if (!parsed.payee) return sendText(wa, t(l, "need_payee"));
  const draft = { category: parsed.category, amount: parsed.amount, currency: parsed.currency, payee: parsed.payee, payeePhone: parsed.payeePhone, rawText: text, modelAmount: parsed.modelAmount, note: merchant ? extractNote(text) : undefined };
  if (draft.category === "send" && !draft.payeePhone) return sendText(wa, t(l, "need_payee"));

  const [cs, hist] = await Promise.all([S.contacts(wa), S.history(wa)]);
  const same = hist.filter(h => h.payee_name?.toLowerCase() === draft.payee.toLowerCase() && h.status === "paid").map(h => Number(h.amount));
  const flags = checkDraft(draft, { contacts: cs, payeeHistory: same, allHistory: hist.filter(h => h.status === "paid").map(h => Number(h.amount)) }).filter(f => !(merchant && f.code === "new_payee"));
  const block = flags.find(f => f.severity === "block");
  if (block) return sendText(wa, t(l, block.code, { typed: (block.data?.typed ?? []).join(", "), limit: block.data?.limit ?? "", digits: draft.amount.toLocaleString("en-US"), words: wordsWithCurrency(draft.amount, draft.currency).toUpperCase() }));

  const net = detectNetwork(wa); if (!net) return sendText(wa, t(l, "bad_wallet"));
  const fee = Math.round(draft.amount * net.fee * 100) / 100, total = draft.amount + fee, token = ref();
  const needD = needsDigits(flags);
  await S.setSession(wa, { state: "confirm", token, draft, needDigits: needD, total, fee });
  const body = [t(l, "head"), `${t(l, "cat")}: ${CAT(l, draft.category)}`,
    `${t(l, "amount")}: ${fmtMoney(draft.amount, draft.currency)} (${wordsWithCurrency(draft.amount, draft.currency)})`,
    `${t(l, "to")}: ${draft.payee}${draft.payeePhone ? " · " + draft.payeePhone : ""}`, ...(draft.note ? [`${t(l, "note")}: ${draft.note}`] : []), `${t(l, "fee")}: ${fmtMoney(fee, draft.currency)} (${net.name})`, `${t(l, "total")}: ${fmtMoney(total, draft.currency)}`,
    ...flagLines(l, draft, flags)].join("\n");
  return sendButtons(wa, body, [{ id: `y:${token}`, title: t(l, "btn_yes") }, { id: `n:${token}`, title: t(l, "btn_no") }]);
}

export async function handleButton(wa: string, id: string) {
  const user = await S.getUser(wa); const l = user?.language ?? "en"; const s = await S.getSession(wa);
  const [act, token] = id.split(":");
  if (s && s.token === token && act === "n") { await S.clearSession(wa); return sendText(wa, t(l, "cancelled")); }
  if (s && s.token === token && s.state === "recv") return confirmReceive(wa, l, s);
  if (s && s.token === token && s.state === "out") { await S.setSession(wa, { state: "digits", kind: "out", draft: s.draft }); return sendText(wa, t(l, "retype", { digits: s.draft.amount.toLocaleString("en-US") })); }
  if (!s || s.state !== "confirm" || s.token !== token) return sendText(wa, t(l, s ? "nothing" : "expired"));
  if (act === "n") { await S.clearSession(wa); return sendText(wa, t(l, "cancelled")); }
  if (s.needDigits) { await S.setSession(wa, { state: "digits", draft: s.draft, total: s.total, fee: s.fee }); return sendText(wa, t(l, "retype", { digits: s.draft.amount.toLocaleString("en-US") })); }
  return execute(wa, l, s.draft, s);
}

async function execute(wa: string, l: string, d: any, _s?: unknown) {
  const net = detectNetwork(wa)!; const phone = normalizePhone(wa)!;
  const fee = Math.round(d.amount * net.fee * 100) / 100, total = d.amount + fee, reference = ref();
  await S.clearSession(wa);
  await S.savePayment({ reference, user_id: wa, recipient: d.payee, payee_name: d.payee, payee_phone: d.payeePhone ?? null, note: d.note ?? null, phone, method: net.method, amount: d.amount, total_charged: total, currency: d.currency, category: d.category, status: "pending" });
  try {
    const r = await initiate({ reference, amount: total, phone, method: net.method, email: process.env.PAYNOW_AUTH_EMAIL!, info: `${d.category} to ${d.payee}${d.note ? " " + d.note : ""}` });
    if ((r.status ?? "").toLowerCase() !== "ok") throw new Error(r.error || "rejected");
    return sendText(wa, t(l, "prompt", { total: fmtMoney(total, d.currency), network: net.name, ref: reference }));
  } catch { await S.updatePayment(reference, "failed"); return sendText(wa, t(l, "failed", { ref: reference, status: "failed" })); }
}

export async function onPaymentResult(reference: string, status: string) {
  const row = await S.updatePayment(reference, status.toLowerCase()); if (!row) return; // unknown ref or already final
  const l = (await S.getUser(row.user_id))?.language ?? "en";
  if (status.toLowerCase() === "paid") { await S.saveContact(row.user_id, row.payee_name, row.payee_phone); await sendText(row.user_id, t(l, "paid", { amount: fmtMoney(Number(row.amount), row.currency), payee: row.payee_name, ref: reference })); }
  else if (["cancelled", "failed", "disputed"].includes(status.toLowerCase())) await sendText(row.user_id, t(l, "failed", { ref: reference, status: status.toLowerCase() }));
}
