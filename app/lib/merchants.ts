// Simbisa Brands family + Dial-a-Delivery. Add more outlets here (or move to a DB table) as merchant agreements are signed.
export type Merchant = { id: string; name: string; kind: "food" | "delivery"; match: RegExp };
export const MERCHANTS: Merchant[] = [
  { id: "dad", name: "Dial-a-Delivery", kind: "delivery", match: /dial[\s-]*a[\s-]*delivery|\bdad\b/i },
  { id: "chickeninn", name: "Chicken Inn", kind: "food", match: /chicken[\s-]*inn/i },
  { id: "pizzainn", name: "Pizza Inn", kind: "food", match: /pizza[\s-]*inn/i },
  { id: "creamyinn", name: "Creamy Inn", kind: "food", match: /creamy[\s-]*inn/i },
  { id: "bakersinn", name: "Baker's Inn", kind: "food", match: /baker'?s[\s-]*inn/i },
  { id: "fishinn", name: "Fish Inn", kind: "food", match: /fish[\s-]*inn/i },
  { id: "nandos", name: "Nando's", kind: "food", match: /nando'?s/i },
  { id: "steers", name: "Steers", kind: "food", match: /\bsteers\b/i },
  { id: "rocomamas", name: "RocoMamas", kind: "food", match: /roco[\s-]*mamas?/i },
  { id: "galitos", name: "Galito's", kind: "food", match: /galito'?s/i },
];
export const findMerchant = (text: string) => MERCHANTS.find(m => m.match.test(text));
/** Order reference / delivery address typed by the user, passed along as a note. */
export const extractNote = (text: string) =>
  [text.match(/\b(?:order|ref)\s*#?\s*([A-Za-z0-9-]{3,20})/i)?.[0], text.match(/\bdeliver(?:y|ed)?\s+to\s+(.{3,60})$/i)?.[0]].filter(Boolean).join(" · ").slice(0, 120) || undefined;
