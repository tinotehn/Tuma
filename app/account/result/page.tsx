import { Suspense } from "react";
export const metadata = { title: "TUMA", robots: { index: false, follow: false } };
const MSG: Record<string, string> = {
  ok: "Done. Go back to WhatsApp: TUMA sent you a message to confirm.", expired: "This link has expired. Ask TUMA on WhatsApp for a new one.", used: "This link was already used. Ask TUMA on WhatsApp for a new one.",
  bank: "Please choose a bank from the list.", account: "That account number does not look right. It must be 9 to 16 digits.", mismatch: "The two account numbers did not match. Go back and try again with a new link.",
  limit: "That amount is above the transfer limit. Start again in WhatsApp.",
};
export default function Result({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  return <Suspense fallback={null}><Msg searchParams={searchParams} /></Suspense>;
}
async function Msg({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const s = (await searchParams).s ?? "";
  return <main className="mx-auto max-w-md p-6 text-forest"><h1 className="font-serif text-3xl tracking-[0.3em]">TUMA</h1><p className="mt-6">{MSG[s] ?? "Too many attempts. Ask TUMA on WhatsApp for a new link."}</p></main>;
}
