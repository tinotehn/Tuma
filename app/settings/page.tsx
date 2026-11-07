//app/setting/page.tsx
import Link from "next/link";

export default function Settings(){
    return(
        <div className="min-h-screen bg ivory max-w-md mx-auto p-4 pd-20">
            <h1 className="font-serif text-2xl text-forest mt-8 mb-6">Settings</h1>

            <div className="bg-white rounded-2xl border border-forest/10 divide-y divide-forest">
            <div className="p-4 flex justify between">
                <span className="text-sm text-forest">Ellen . ellen@tuma.co.zw</span>
                <span className="text-xs champagne/20 text-forest px-2 py-1 rounded-full"> Verified  </span>
            </div>
                <Link href="/terms" className="p-4 flex justify-between text-sm text-forest">
                <span>Terms & Conditions</span><span>,</span>
                </Link>
                <div className="p-4 text-sm text-forest/50">App Version . 1.0.0 TUMA</div>
            </div>

            <div className="mt-6 bg-forest/5 rounded-xl p-3">
                <p className="text-xs text-forest/70"> Security: All transfer requires biometric + server-side amount validation. We NEVER auto-transfer on voice alone.</p>
            </div>
        </div>
    );
}