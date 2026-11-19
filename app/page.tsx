import Link from "next/link";

const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER; // digits only, e.g. 263771234567
const waLink = (text: string) => (WA ? `https://wa.me/${WA}?text=${encodeURIComponent(text)}` : "#");

const EXAMPLES = [
  { lang: "English", text: "Send $20 to Tendai 0771234567" },
  { lang: "chiShona", text: "Tumira $20 kuna Tendai 0771234567" },
  { lang: "isiNdebele", text: "Thumela $20 kuTendai 0771234567" },
  { lang: "English", text: "Pay tithe $50 to Grace Church" },
  { lang: "English", text: "Pay school fees $120 to Sipho" },
];

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-md p-4 pb-24">
      <header className="mt-8 mb-6">
        <h1 className="font-serif text-3xl tracking-[0.3em] text-forest">TUMA</h1>
        <p className="mt-1 text-sm text-forest/60">Pay on WhatsApp. Checked before it&apos;s sent.</p>
      </header>

      <section className="relative overflow-hidden rounded-[20px] border border-champagne/20 bg-forest p-6 text-ivory">
        <p className="inline-block rounded-full bg-ivory/10 px-3 py-1 text-xs">Chat to pay</p>
        <h2 className="mt-3 font-serif text-2xl">Send money, pay bills, school fees, tithes &amp; shopping</h2>
        <p className="mt-2 text-sm text-ivory/70">TUMA reads every amount in digits <em>and</em> words, and warns you about wrong amounts or wrong people before money moves.</p>
        <a href={waLink("Hi")} aria-disabled={!WA} className="mt-5 block rounded-full bg-champagne py-3 text-center text-sm font-semibold text-forest">
          Open TUMA on WhatsApp
        </a>
        {!WA && <p className="mt-2 text-xs text-ivory/60">Set NEXT_PUBLIC_WHATSAPP_NUMBER to enable this button.</p>}
      </section>

      <h3 className="mt-6 mb-3 font-serif text-lg text-forest">Just type it</h3>
      <div className="divide-y divide-forest/5 rounded-2xl border border-forest/10 bg-white">
        {EXAMPLES.map(e => (
          <a key={e.text} href={waLink(e.text)} className="block p-4">
            <p className="text-sm font-medium text-forest">&ldquo;{e.text}&rdquo;</p>
            <p className="text-xs text-forest/50">{e.lang}</p>
          </a>
        ))}
      </div>

      <h3 className="mt-6 mb-3 font-serif text-lg text-forest">Your account</h3>
      <Link href="/link" className="flex items-center justify-between rounded-2xl border border-forest/10 bg-white p-4 text-sm text-forest shadow-sm">
        <span>Choose your bank or wallet</span><span aria-hidden>→</span>
      </Link>
      <p className="mt-6 text-center text-[11px] text-forest/50">
        <Link href="/privacy" className="underline">Privacy</Link> · <Link href="/terms" className="underline">Terms</Link>
      </p>
    </main>
  );
}
