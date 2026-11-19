import { createClient } from "@supabase/supabase-js";
const db = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

export const getUser = async (wa: string) => (await db().from("wa_users").select("*").eq("wa_id", wa).maybeSingle()).data as { wa_id: string; name: string | null; language: string; institution?: string | null } | null;
export const upsertUser = (wa: string, name: string | null, language: string) => db().from("wa_users").upsert({ wa_id: wa, name, language });
export const getSession = async (wa: string) => { const { data } = await db().from("wa_sessions").select("state, expires_at").eq("wa_id", wa).maybeSingle();
  return data && new Date(data.expires_at) > new Date() ? (data.state as any) : null; };
export const setSession = (wa: string, state: any, minutes = 10) => db().from("wa_sessions").upsert({ wa_id: wa, state, expires_at: new Date(Date.now() + minutes * 60000).toISOString() });
export const clearSession = (wa: string) => db().from("wa_sessions").delete().eq("wa_id", wa);
/** true = first time we see this WhatsApp message id (Meta retries webhooks). */
export const markSeen = async (id: string) => !(await db().from("wa_messages").insert({ id })).error;
export const contacts = async (wa: string) => ((await db().from("contacts").select("name, phone").eq("wa_id", wa)).data ?? []) as { name: string; phone: string | null }[];
export const saveContact = (wa: string, name: string, phone: string | null) => db().from("contacts").upsert({ wa_id: wa, name, phone }, { onConflict: "wa_id,name" });
export const history = async (wa: string, limit = 50) => ((await db().from("payments").select("amount, payee_name, status, category, currency, created_at, reference").eq("user_id", wa).order("created_at", { ascending: false }).limit(limit)).data ?? []) as any[];
export const savePayment = (p: Record<string, any>) => db().from("payments").insert(p);
export const getPayment = async (ref: string) => (await db().from("payments").select("*").eq("reference", ref).maybeSingle()).data as any;
export const updatePayment = async (ref: string, status: string) => (await db().from("payments").update({ status, updated_at: new Date().toISOString() }).eq("reference", ref).in("status", ["pending", "created", "sent", "awaiting delivery"]).select("*").maybeSingle()).data as any;
export const setInstitution = (wa: string, id: string) => db().from("wa_users").update({ institution: id }).eq("wa_id", wa);
export const createProfile = (p: Record<string, any>) => db().from("receive_profiles").insert(p);
export const findProfile = async (code: string) => (await db().from("receive_profiles").select("*").eq("code", code.toUpperCase()).maybeSingle()).data as any;
/** false if this partner reference was already processed (webhook retries). */
export const insertRemittance = async (r: Record<string, any>) => !(await db().from("remittances").insert(r)).error;
export const updateRemittance = async (reference: string, status: string, payoutRef?: string) =>
  (await db().from("remittances").update({ status, payout_ref: payoutRef ?? null, updated_at: new Date().toISOString() }).eq("reference", reference).select("*").maybeSingle()).data as any;
export const setPollUrl = (ref: string, url: string) => db().from("payments").update({ poll_url: url }).eq("reference", ref);
/** Payments still unresolved after `olderThanMin` minutes (the verify worker reconciles these with Paynow). */
export const pendingPayments = async (olderThanMin: number, limit = 25) => ((await db().from("payments").select("reference, poll_url, created_at, user_id")
  .in("status", ["pending", "created", "sent", "awaiting delivery"]).lt("created_at", new Date(Date.now() - olderThanMin * 60000).toISOString()).order("created_at").limit(limit)).data ?? []) as any[];
export const remittancesFor = async (wa: string, limit = 20) => ((await db().from("remittances").select("amount, currency, status, purpose, platform, source_name, created_at, reference").eq("recipient_wa", wa).order("created_at", { ascending: false }).limit(limit)).data ?? []) as any[];
/** Safety-check log: blocked payments, warnings shown, failed re-entries. Never allowed to break a payment. */
export const logSecurityEvent = async (wa: string, code: string, amount: number, currency: string) => { try { await db().from("security_events").insert({ wa_id: wa, code, amount, currency }); } catch { /* best effort */ } };
export const paymentsSince = async (days: number, limit = 10000) => ((await db().from("payments").select("amount, fee, commission, currency, status, created_at").gte("created_at", new Date(Date.now() - days * 864e5).toISOString()).limit(limit)).data ?? []) as any[];
export const securityEventsSince = async (days: number, limit = 10000) => ((await db().from("security_events").select("code, amount, currency, created_at").gte("created_at", new Date(Date.now() - days * 864e5).toISOString()).limit(limit)).data ?? []) as any[];
export const remittancesSince = async (days: number, limit = 10000) => ((await db().from("remittances").select("commission, currency, status, created_at").eq("status", "paid_out").gte("created_at", new Date(Date.now() - days * 864e5).toISOString()).limit(limit)).data ?? []) as any[];
export const createCollector = (c: { code: string; wa_id: string; kind: string; name: string }) => db().from("collectors").insert(c);
export const findCollector = async (code: string) => (await db().from("collectors").select("*").eq("code", code.toUpperCase()).maybeSingle()).data as { code: string; wa_id: string; kind: "landlord" | "shop"; name: string } | null;
export const collectorsOf = async (wa: string) => ((await db().from("collectors").select("*").eq("wa_id", wa)).data ?? []) as Collector[];
export const collectedFor = async (wa: string, days: number, limit = 5000) => ((await db().from("payments").select("amount, commission, currency, collector_unit, created_at").eq("collector_wa", wa).eq("status", "paid").gte("created_at", new Date(Date.now() - days * 864e5).toISOString()).limit(limit)).data ?? []) as any[];

// ---- settlement of collected money to landlords / shop owners ----
export type Collector = { code: string; wa_id: string; kind: "landlord" | "shop"; name: string; bank?: string | null; account?: string | null; account_set_at?: string | null; settlement_paused?: boolean };
export const setSettlementAccount = (wa: string, bank: string, account: string) => db().from("collectors").update({ bank, account, account_set_at: new Date().toISOString(), settlement_paused: false }).eq("wa_id", wa);
export const pauseSettlement = (wa: string) => db().from("collectors").update({ settlement_paused: true }).eq("wa_id", wa);
export const collectorsWithAccount = async () => ((await db().from("collectors").select("wa_id, bank, account, account_set_at, settlement_paused").not("account", "is", null)).data ?? []) as Collector[];
export const eligiblePayments = async (wa: string, cutoffIso: string, limit = 5000) => ((await db().from("payments").select("amount, commission, currency").eq("collector_wa", wa).eq("status", "paid").is("settlement_ref", null).lte("created_at", cutoffIso).limit(limit)).data ?? []) as any[];
/** Atomic claim: only rows still unsettled get stamped, so two runs can never settle the same payment twice. */
export const claimPayments = async (wa: string, ref: string, cutoffIso: string, currency: string) => ((await db().from("payments").update({ settlement_ref: ref }).eq("collector_wa", wa).eq("status", "paid").eq("currency", currency).is("settlement_ref", null).lte("created_at", cutoffIso).select("amount, commission")).data ?? []) as any[];
export const releasePayments = (ref: string) => db().from("payments").update({ settlement_ref: null }).eq("settlement_ref", ref);
export const createSettlement = (s: Record<string, any>) => db().from("settlements").insert(s);
export const updateSettlement = async (ref: string, status: string, payoutRef?: string) => (await db().from("settlements").update({ status, payout_ref: payoutRef ?? null, updated_at: new Date().toISOString() }).eq("reference", ref).in("status", ["queued", "sent"]).select("*").maybeSingle()).data as any;
export const unsettledFor = async (wa: string) => ((await db().from("payments").select("amount, commission, currency").eq("collector_wa", wa).eq("status", "paid").is("settlement_ref", null).limit(5000)).data ?? []) as any[];
export const settlementsOf = async (wa: string, days: number) => ((await db().from("settlements").select("net, currency, created_at").eq("wa_id", wa).eq("status", "paid_out").gte("created_at", new Date(Date.now() - days * 864e5).toISOString()).limit(1000)).data ?? []) as any[];
