import { timingSafeEqual } from "crypto";
import * as S from "@/lib/bot/store";
import { pollStatus } from "@/lib/bot/paynow";
import { onPaymentResult } from "@/lib/bot/handler";

// Reconciliation worker. Paynow webhooks can be lost, so every few minutes we ask Paynow about payments still pending.
// Trigger: Vercel Cron (vercel.json) sends `Authorization: Bearer $CRON_SECRET`. Safe to call repeatedly (updates are idempotent).
const STALE_MIN = 30; // still unresolved after this long with no Paynow answer -> mark expired, nothing was taken

export async function GET(req: Request) {
  const given = Buffer.from(req.headers.get("authorization") ?? ""), want = Buffer.from(`Bearer ${process.env.CRON_SECRET ?? ""}`);
  if (!process.env.CRON_SECRET || given.length !== want.length || !timingSafeEqual(given, want)) return new Response("Unauthorized", { status: 401 });
  const out = { checked: 0, updated: 0, expired: 0, errors: 0 };
  for (const p of await S.pendingPayments(1)) {
    out.checked++;
    try {
      const r = p.poll_url ? await pollStatus(p.poll_url) : { ok: false as const, status: undefined };
      const status = r.status?.toLowerCase();
      if (r.ok && status && !["created", "sent", "awaiting delivery"].includes(status)) { await onPaymentResult(p.reference, status); out.updated++; }
      else if (Date.now() - new Date(p.created_at).getTime() > STALE_MIN * 60000) { await onPaymentResult(p.reference, "failed"); out.expired++; }
    } catch (e) { out.errors++; console.error("verify worker", p.reference, (e as Error).message); }
  }
  return Response.json(out);
}
