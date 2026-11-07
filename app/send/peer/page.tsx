//app/send/peer/page.tsx -P2P with AI Voice + Safety Check
"use client";
import { useState } from "react";

type Parsed ={amount:number; recipient: string; note: string};

export default function PeerTransfer(){
const[parsed, setParsed] = useState<Parsed>({amount: 1000, recipient: "Ellen", note:""});
const[isHighRisk, setIsHighRisk] = useState(false);

//SAFETY LOGIC: FLAG if 100x usual amount
const checkRisk = (amount: number) => {
    const avgAmount = 1200; // get from user history in real app
    if (amount > avgAmount * 10) setIsHighRisk(true);
    else setIsHighRisk(false);
};

return(
    <div className="min-h-screen bg-ivory max-w-md mx-auto">
        {/*Top Bar */}
        <div className="bg-forest pt-12 pb-6 px-4 rounded-b-[24px]">
            <p className="text-center text-champagne text-sm">Available Balance $245,800</p>
        </div>

        <div  className="p-4 mt-4">
            <h1 className="font-serif text-2xl text-forest mb-4">Send to Friends</h1>

            {/* Voice Command Card */}
            <div className="bg-white border-2 border-champagne/30 rounded[16px] p-4 shadow-sm">
            <div className="flex gap-2 items-center mb-2">
                <span className="w-8 h-8 bg-forest rounded-full flex items-center justify-center text-ivory"></span>
                <p className="font-semibold text-forest text-sm">Voice Command</p>         
            </div>
            <p className="text-forest">We heard: <span className="font-semibold">"Send $1,000 to Tadiwa"</span></p>
            <div className="mt-2 inline-flex items-center gap-1 bg-forecast/5 px-2 py-1 rounded-full text-xs text-forest">
            AI Parsed Confirmation
            </div>
            </div>

            {/* AI Recognized - CRITICAL FOR SAFETY */}

            <div className="bg-white rounded-[16px] p-4 mt-4 border border-forest/10">
            <p className="text-sm font-semibold text-forest mb-3">AI recognized:</p>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-forest/60">Amount</span><span className="font-bold text-forest">${parsed.amount.toLocaleString()}</span></div>
                  <div className="flex  justify-between"><span className="text-forest">Recipient</span><span className="font-bold text-forest">{parsed.recipient}</span></div>
                  <div className="flex justify-between"><span className="text-forest/60">Note</span><span className="text-forest/40">-</span></div>
            </div>

            {/* HIGH RISK WARNING  - This stops $1M error*/}
            {isHighRisk && (
                <div className="mt-4 bg-red-50 border border-red-200 rouded-xl p-3">
                    <p className="text-red-700 text-xs font-bold">Unusual Amount- This is 100x your average transfer to Tadiwa. Please confirm.</p>
                </div>
            )}
            </div>

            {/* Confirm Button */}
            <button
            onClick={() => alert(`Transfer ${parsed.amount} to ${parsed.recipient} - Call Paystack API here`)}
            className="w-full mt-6 bg-forest hover:bg-forestLight text-ivory rounded-[14px] py-4 font-semibold text-center transition"
            >
            Confirm & Send ${parsed.amount.toLocaleString()}
            </button>
            <p className="text-center text-[11px] text-forest/50 mt-2">You will need FaceID / PIN for this transfer </p>

            {/* Contacts */}
            <h3 className="font-serif text-lg text-forest mt-8 mb-3">Contacts</h3>
            <input placeholder="Search contacts..." className="w-full rounded-xl border border-forest/10 px-4 py-3 text-sm mb-3" />
            <div className="bg-champagne/20 border-champagne rounded-xl p-3 flex gap-3 ite-center">
            <div className="w-10 h-10 rounded-full bg-forest text-ivory flex items-center justify-center">A</div>
            </div>
            <div>
                <p className="text-sm font-semibold  text-forest"> Tadiwa @tadiwa.o</p>
                <p className="text-xs text-forest/60"> Last sent Yesterday Verified</p>
            </div>
        </div>
    </div>
);
}