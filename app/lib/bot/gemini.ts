import { allAmounts, detectCurrency, normalizePhone, type Currency } from "../money";
import { CATEGORY_WORDS } from "../i18n";

export type Parsed = { intent: "pay" | "other"; category: string; amount?: number; currency: Currency; payee: string; payeePhone?: string; lang?: string };
const SYSTEM = `You are TUMA's payment parser for WhatsApp in Zimbabwe. Messages may be English, Shona or Ndebele.
Return ONLY JSON: {"intent":"pay"|"other","category":"send|bill|school_fees|tithe|offering|shopping","amount":number|null,"currency":"USD"|"ZWG","payee":string,"payeePhone":string|null,"lang":"en|sn|nd"}.
Copy the amount exactly as typed (1,000 = 1000; 1,000,000 = 1000000). Never guess a missing amount or payee. Payee is the person/church/school/biller to receive money.`;

/** Heuristic parser: used when Gemini is down or returns junk. */
export function heuristic(text: string): Parsed {
  const category = Object.entries(CATEGORY_WORDS).find(([, r]) => r.test(text))?.[0] ?? "send";
  const phone = text.match(/(?:\+?263|0)7[1378][\d\s]{7,9}/)?.[0];
  const am = allAmounts(text);
  const payee = (text.match(/\b(?:to|kuna|ku|for)\s+([A-Za-z][A-Za-z' .-]{1,40}?)(?=\s+\+?\d|\s*$|[,.])/i)?.[1] ?? "").trim();
  return { intent: am.length || /send|pay|tumira|thumela|bhadhara|khokha/i.test(text) ? "pay" : "other", category, amount: am.length ? Math.max(...am) : undefined, currency: detectCurrency(text), payee, payeePhone: phone?.replace(/\s/g, "") };
}

export async function parseMessage(text: string): Promise<Parsed & { modelAmount?: number }> {
  const h = heuristic(text);
  if (!process.env.GEMINI_API_KEY) return h;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? "gemini-3.8-flash"}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: "user", parts: [{ text }] }], generationConfig: { responseMimeType: "application/json" } }),
      signal: AbortSignal.timeout(8000),
    });
    const j: any = await r.json();
    const g = JSON.parse(j.candidates[0].content.parts[0].text);
    // Gemini fills in the *meaning*; digits always come from the user's own text via the deterministic parser.
    return { intent: g.intent === "pay" ? "pay" : h.intent, category: g.category || h.category, amount: h.amount, modelAmount: typeof g.amount === "number" ? g.amount : undefined,
      currency: g.currency === "ZWG" ? "ZWG" : h.currency, payee: (g.payee || h.payee || "").toString().slice(0, 60), payeePhone: normalizePhone(g.payeePhone || "") ? g.payeePhone : h.payeePhone, lang: g.lang };
  } catch { return h; }
}
