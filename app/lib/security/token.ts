import { createHmac, timingSafeEqual } from "crypto";
// Short-lived signed links (e.g. the full-history page opened from WhatsApp). The WhatsApp number IS the identity.
const secret = () => process.env.LINK_SECRET ?? "";
const b64 = (s: string) => Buffer.from(s).toString("base64url");
export function signToken(wa: string, ttlSec = 900, now = Date.now()) {
  if (!secret()) throw new Error("LINK_SECRET not set");
  const body = b64(JSON.stringify({ wa, exp: Math.floor(now / 1000) + ttlSec }));
  return `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
export function verifyToken(tok: string | undefined, now = Date.now()): string | null {
  if (!tok || !secret()) return null;
  const [body, sig] = tok.split("."); if (!body || !sig) return null;
  const exp = createHmac("sha256", secret()).update(body).digest("base64url");
  if (exp.length !== sig.length || !timingSafeEqual(Buffer.from(exp), Buffer.from(sig))) return null;
  try { const p = JSON.parse(Buffer.from(body, "base64url").toString()); return p.exp * 1000 > now && typeof p.wa === "string" ? p.wa : null; } catch { return null; }
}
