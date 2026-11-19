import { Suspense } from "react";
import { BANKS } from "@/lib/institutions";
import { verifyLink } from "@/lib/security/token";
import { submitAccount } from "./actions";

export const metadata = { title: "TUMA secure account entry", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
const field = "w-full rounded-xl border border-forest/20 bg-white p-3 text-forest outline-none focus:border-champagne";

export default function AccountPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  return <Suspense fallback={<main className="mx-auto max-w-md p-6 text-forest">Loading…</main>}><Form searchParams={searchParams} /></Suspense>;
}
async function Form({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const token = (await searchParams).t, v = verifyLink(token);
  if (!v) return <main className="mx-auto max-w-md p-6 text-forest"><h1 className="font-serif text-2xl">TUMA</h1><p className="mt-4">This link has expired or was already used. Go back to WhatsApp and ask TUMA for a new one.</p></main>;
  const what = v.p === "out" ? `Sending $${Number(v.c.amount).toLocaleString("en-US")} to ${String(v.c.payee)}` : v.p === "settle" ? "Where should we pay the money you collect?" : "Where should your received money be paid?";
  return (
    <main className="mx-auto min-h-screen max-w-md p-5">
      <h1 className="mt-6 font-serif text-3xl tracking-[0.3em] text-forest">TUMA</h1>
      <p className="mt-1 text-sm text-forest/60">Secure bank account entry</p>
      <p className="mt-5 rounded-xl bg-champagne/20 p-3 text-sm text-forest">{what}</p>
      <form action={submitAccount} className="mt-5 space-y-4">
        <input type="hidden" name="t" value={token} />
        <label className="block text-sm text-forest">Bank<select name="bank" required className={field}>{BANKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <label className="block text-sm text-forest">Account number<input name="account" inputMode="numeric" pattern="[0-9 -]{9,19}" required autoComplete="off" className={field} /></label>
        <label className="block text-sm text-forest">Account number again<input name="confirm" inputMode="numeric" pattern="[0-9 -]{9,19}" required autoComplete="off" className={field} /></label>
        <button className="w-full rounded-full bg-forest py-3 font-semibold text-champagne">Continue in WhatsApp</button>
      </form>
      <p className="mt-4 text-xs text-forest/50">Check every digit. A wrong number sends money to someone else. We never ask for your PIN or password.</p>
    </main>
  );
}
