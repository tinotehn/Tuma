/** Strip invisible/control characters (used to hide prompt-injection or spoof names) and cap length. */
export const sanitizeInput = (s: string, max = 300) =>
  s.normalize("NFKC").replace(/[\u0000-\u0008\u000B-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
export const isSafeName = (s: string) => /^[\p{L}\p{N} '.,&-]{1,60}$/u.test(s);
/** Only poll URLs that really are Paynow's (SSRF guard for the verify worker). */
export const isPaynowUrl = (u: string) => { try { const x = new URL(u); return x.protocol === "https:" && (x.hostname === "www.paynow.co.zw" || x.hostname === "paynow.co.zw"); } catch { return false; } };
