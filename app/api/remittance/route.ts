import { verifySignature } from "@/lib/bot/whatsapp";
import { onFunds, onPayout } from "@/lib/bot/remit";

// Partner -> TUMA. Header: x-signature = "sha256=" + HMAC_SHA256(REMITTANCE_WEBHOOK_SECRET, rawBody)
// Body: { type: "funds", reference, code, amount, currency: "USD"|"ZWG", senderName?, senderCountry? }
//    or { type: "payout", reference, status: "paid"|"failed" }
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-signature"), process.env.REMITTANCE_WEBHOOK_SECRET)) return new Response("Bad signature", { status: 401 });
  try {
    const e = JSON.parse(raw);
    const result = e.type === "funds" ? await onFunds({ ...e, amount: Number(e.amount) }) : e.type === "payout" ? await onPayout(e) : "bad_event";
    return Response.json({ result }, { status: result === "bad_event" ? 400 : 200 });
  } catch (err) { console.error("remittance webhook", err); return new Response("Error", { status: 500 }); } // 500 => partner retries
}
