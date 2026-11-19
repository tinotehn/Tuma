import { verifyCallback } from "@/lib/bot/paynow";
import { onPaymentResult } from "@/lib/bot/handler";

export async function POST(req: Request) {
  const { ok, params } = verifyCallback(await req.text());
  if (!ok) return new Response("Bad hash", { status: 400 });
  if (params.reference && params.status) await onPaymentResult(params.reference, params.status);
  return new Response("OK");
}
