import { createHmac, timingSafeEqual } from "crypto";
export * from "../sendMessage";

/** Verifies Meta's X-Hub-Signature-256 (also used for partner webhooks with their own secret). */
export function verifySignature(raw: string, header: string | null, secret = process.env.WHATSAPP_APP_SECRET ?? "") {
  if (!header || !secret) return false;
  const exp = Buffer.from("sha256=" + createHmac("sha256", secret).update(raw).digest("hex")); const got = Buffer.from(header);
  return exp.length === got.length && timingSafeEqual(exp, got);
}
