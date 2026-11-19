// Zimbabwe's 16 official languages (2013 Constitution). Sign language can't be rendered as text, so 15 are selectable.
// FULL strings: English, Shona, Ndebele. The rest fall back to English per-key until reviewed by native speakers.
export const LANGS = [
  { id: "en", name: "English" }, { id: "sn", name: "chiShona" }, { id: "nd", name: "isiNdebele" },
  { id: "ny", name: "Chewa" }, { id: "bwe", name: "Chibarwe" }, { id: "kck", name: "Kalanga" }, { id: "khi", name: "Khoisan" },
  { id: "nmq", name: "Nambya" }, { id: "ndc", name: "Ndau" }, { id: "ts", name: "Shangani" }, { id: "st", name: "Sotho" },
  { id: "toi", name: "Tonga" }, { id: "tn", name: "Tswana" }, { id: "ve", name: "Venda" }, { id: "xh", name: "Xhosa" },
] as const;
export type Lang = (typeof LANGS)[number]["id"];
export const FULL_LANGS: Lang[] = ["en", "sn", "nd"];

const en: Record<string, string> = {
  welcome: "👋 Welcome to TUMA. I can send money, pay bills, school fees, tithes & offerings, and shopping.\nTry: \"Send $20 to Tendai 0771234567\" or \"Pay tithe $50 to Grace Church\".\nType *language* to change language, *history* for recent payments.",
  head: "Please check carefully:", cat: "Type", amount: "Amount", to: "To", fee: "Fee", total: "You pay",
  c_send: "Send money", c_bill: "Bill payment", c_school_fees: "School fees", c_tithe: "Tithe", c_offering: "Offering", c_shopping: "Shopping",
  warn_million: "⚠️ FLAGGED: You typed {digits} — this is {words}. Please check the zeros!",
  warn_unusual: "⚠️ This is {ratio}× your usual amount (usually {typical}). Is it a typo?",
  warn_similar: "⚠️ You have a saved contact \"{match}\". Did you mean them instead of \"{payee}\"?",
  warn_phone: "⚠️ {payee} is saved with number {saved}, but you entered {entered}.",
  new_payee: "ℹ️ First payment to {payee}.",
  btn_yes: "Confirm", btn_no: "Cancel", retype: "Because of the warnings above, reply with the exact amount in digits to confirm: {digits}",
  retype_wrong: "That does not match. Payment cancelled for your safety.",
  need_amount: "I could not find a clear amount. Please type it again, e.g. $20.", need_payee: "Who should receive it? Add a name (and phone number for money transfers).",
  ambiguous: "I found more than one amount ({typed}). Please send one clear amount.", bad_phone: "That phone number does not look right. Use a Zimbabwe mobile e.g. 0771234567.",
  over_limit: "⚠️ {digits} ({words}) is above the per-payment limit of {limit}. If you meant less, check the zeros and try again.", bad_wallet: "Your WhatsApp number is not on EcoCash, OneMoney or TeleCash, so I cannot collect payment.",
  expired: "That request expired. Please start again.", nothing: "Nothing is waiting for confirmation.", cancelled: "Cancelled. No money was moved.",
  prompt: "📲 Approve the payment of {total} on your {network} phone. Ref {ref}.", paid: "✅ Paid {amount} to {payee}. Ref {ref}.", failed: "❌ Payment {ref} {status}. No money was taken.",
  lang_menu: "Choose language / Sarudza mutauro / Khetha ulimi:\n{list}\nReply with a number.", lang_set: "Language set to {name}.", lang_fallback: "Full translation for {name} is coming. Using English for now.",
  c_food: "Food order", c_delivery: "Delivery", note: "Note",
  recv_need_bank: "Which bank should the money go to? e.g. \"Receive to CBZ 1234567890123\" or \"YouTube payout to Steward 1234567890\".",
  recv_need_account: "Please send your {bank} account number.",
  recv_card: "Money will be paid into:\n{bank} · {account}\nPurpose: {purpose}\n\nCheck every digit. A wrong number sends money to someone else.",
  recv_ready: "✅ Your receiving code: *{code}*\nGive it to the sender or payer as the reference. Money will be paid into {bank} ·· {last4} and I will message you.",
  remit_in: "💸 Received {amount} from {from}. Sending to your {bank} ·· {last4}.", remit_done: "✅ {amount} has been paid into your {bank} ·· {last4}. Ref {ref}.", remit_failed: "❌ Payout {ref} to {bank} ·· {last4} failed. We will retry or contact you.",
  remit_need_dest: "To send to a Zimbabwe bank account, tell me the name, bank and account number, e.g. \"Send $100 to Grace Moyo CBZ 1234567890123\".",
  remit_check: "Check the name and account number carefully — bank payouts cannot be reversed.", remit_pay: "Pay here to complete your transfer: {url}\nRef {ref}", remit_unavailable: "Diaspora transfers from your country are not active yet. Your request {ref} is saved and we will message you.",
  linked: "✅ {name} is now your default account.", hist_head: "Your last payments:", hist_empty: "No payments yet.", unknown: "Sorry, I did not understand. Try: \"Send $20 to Tendai 0771234567\".", error: "Something went wrong. Please try again.",
};
const sn: Record<string, string> = {
  welcome: "👋 Mhoro, ndinonzi TUMA. Ndinogona kutumira mari, kubhadhara mabhiri, mari yechikoro, chegumi nezvipiriso, nekutenga.\nNyora semuenzaniso: \"Tumira $20 kuna Tendai 0771234567\".\nNyora *mutauro* kuchinja mutauro, *history* kuona zvakabhadharwa.",
  head: "Ngatitarisei zvakanaka:", cat: "Rudzi", amount: "Mari", to: "Kuna", fee: "Muripo", total: "Unobhadhara",
  c_send: "Kutumira mari", c_bill: "Bhiri", c_school_fees: "Mari yechikoro", c_tithe: "Chegumi", c_offering: "Chipiriso", c_shopping: "Kutenga",
  warn_million: "⚠️ NGWARIRA: Wanyora {digits} — iyi ndiyo {words}. Tarisa zero dzacho!",
  warn_similar: "⚠️ Une munhu ari mu contacts anonzi \"{match}\". Waireva iye here pane \"{payee}\"?",
  btn_yes: "Simbisa", btn_no: "Kanzura", retype: "Nekuda kwezyambiro dziri pamusoro, pindura nemari chaiyo mumanhamba: {digits}",
  retype_wrong: "Hazvienderani. Kubhadhara kwakanzurwa kuchengetedza mari yako.", cancelled: "Zvakanzurwa. Hapana mari yakabviswa.",
  prompt: "📲 Simbisa kubhadhara {total} pa{network} pafoni yako. Ref {ref}.", paid: "✅ Wabhadhara {amount} kuna {payee}. Ref {ref}.",
  linked: "✅ {name} yasarudzwa seaccount yako huru.",
  c_food: "Chikafu", c_delivery: "Delivery",
  recv_ready: "✅ Kodhi yako: *{code}*\nIpe munhu anokutumira mari seyereferenzi. Mari ichapinda mu{bank} ·· {last4} ndichakuzivisa.",
  remit_in: "💸 Wagashira {amount} kubva kuna {from}. Iri kutumirwa ku{bank} ·· {last4}.", remit_done: "✅ {amount} yapinda mu{bank} ·· {last4}. Ref {ref}.",
  need_amount: "Handina kuona mari zvakajeka. Nyora zvakare, semuenzaniso $20.", lang_set: "Mutauro wasarudzwa: {name}.", error: "Pane chakaipa. Edza zvakare.",
};
const nd: Record<string, string> = {
  welcome: "👋 Salibonani, nginguTUMA. Ngingathumela imali, ngikhokhe amabhili, imali yesikolo, okweshumi lemiphiso, lokuthenga.\nLoba isib.: \"Thumela $20 kuTendai 0771234567\".\nLoba *ulimi* ukuguqula ulimi, *history* ukubona okukhokhiweyo.",
  head: "Sicela ubheke kuhle:", cat: "Uhlobo", amount: "Imali", to: "Ku", fee: "Imbadalo", total: "Uyakhokha",
  c_send: "Ukuthumela imali", c_bill: "Ibhili", c_school_fees: "Imali yesikolo", c_tithe: "Okweshumi", c_offering: "Umnikelo", c_shopping: "Ukuthenga",
  warn_million: "⚠️ QAPHELA: Ulobe {digits} — lokhu kungu{words}. Bheka amazero!",
  warn_similar: "⚠️ Unomuntu agcinwe ngelika \"{match}\". Ubuhlosile yena kumbe \"{payee}\"?",
  btn_yes: "Qinisekisa", btn_no: "Khansela", retype: "Ngenxa yezixwayiso ezingenhla, phendula ngemali eyiyo ngezinombolo: {digits}",
  retype_wrong: "Akuvumelani. Inkokhelo ikhanseliwe ukukuvikela.", cancelled: "Kukhanseliwe. Kungekho mali ethathiweyo.",
  prompt: "📲 Qinisekisa inkokhelo ye-{total} ku-{network} efonini yakho. Ref {ref}.", paid: "✅ Likhokhile {amount} ku-{payee}. Ref {ref}.",
  linked: "✅ {name} ikhethiwe njengeakhawunti yakho eyinhloko.",
  c_food: "Ukudla", c_delivery: "Ukulethwa",
  recv_ready: "✅ Ikhodi yakho: *{code}*\nIphe umuntu okuthumelela imali njengereferensi. Imali izangena ku-{bank} ·· {last4}, ngizakuthumelela umlayezo.",
  remit_in: "💸 Ulemukele {amount} kuvela ku-{from}. Iyathunyelwa ku-{bank} ·· {last4}.", remit_done: "✅ {amount} ingene ku-{bank} ·· {last4}. Ref {ref}.",
  need_amount: "Angikutholanga imali ngokucacileyo. Loba futhi, isib. $20.", lang_set: "Ulimi lukhethiwe: {name}.", error: "Kukhona okungahambanga kuhle. Zama futhi.",
};
const TABLE: Record<string, Record<string, string>> = { en, sn, nd };
export function t(lang: string, key: string, vars: Record<string, string | number> = {}) {
  const s = TABLE[lang]?.[key] ?? en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
export const langMenu = () => LANGS.map((l, i) => `${i + 1}. ${l.name}`).join("\n");
export const KEYWORDS = {
  link: /^link\s+([a-z]+)$/i, language: /^(language|lang|mutauro|ulimi)\b/i, history: /^(history|zvakabhadharwa|umlando)\b/i,
  cancel: /^(cancel|stop|kanzura|khansela)\b/i, help: /^(hi|hello|help|menu|mhoro|hesi|salibonani|sawubona)\b/i,
};
export const CATEGORY_WORDS: Record<string, RegExp> = {
  tithe: /\b(tithe|tithes|chegumi|zvegumi|okweshumi|ishumi)\b/i, offering: /\b(offering|chipiriso|zvipiriso|umnikelo|miphiso)\b/i,
  school_fees: /\b(school fees?|fees|tuition|mari yechikoro|fizi|imali yesikolo)\b/i, bill: /\b(bill|zesa|electricity|water|rates|bhiri|ibhili|airtime|dstv)\b/i,
  shopping: /\b(shop|shopping|buy|groceries|kutenga|ukuthenga)\b/i,
};
