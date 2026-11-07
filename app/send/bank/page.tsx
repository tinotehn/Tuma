//app/send/bank/page.tsx
"use client";
import { useState } from "react";

export default function BankTransfer(){
    const [amount, setAmount] = useState("1000");
    const balance = 245800;

    return(
        <div className="min-h-screen bg-ivory max-w-md mx-auto pd-20">
            <div className="bg-forest pt-12 pb-8 px-4 rounded-b-[24px]">
                <h1 className="text-ivory font-serif text-xl text-center">Bank Transfer</h1>
                <p className="text-center text-champagne text-xs mt-1">Available ${balance.toLocaleString()}</p>
            </div>

            <div className="p-4 mt-4 space-y-4">
                {/* Amount */}
                <div className="bg-white rounded-[16px] boder border-forest/10">
                <label className="text-xs text-forest/60">Amount</label>
                <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-forest">$</span>
                    <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-3xl font-serif font-bold text-forest w-full ouline-none"
                        inputMode="numeric"
                     />
                </div>
                {Number(amount) > balance && (
                    <p className="text-xs text-red-600 mt-2">Exceeds available balance </p>
                )}
                </div>

                {/* Bank Select */}
                <div className="bg-wite rounded-[16px] p-4 border border-forest/10">
                    <p className="text-sm font-semibold text-forest mb-3">To</p>
                    <div className="space-y-2">
                            <div className="flex justify-between items-center p-3 rounde-xl bg-forest/5 border border-forest/10">
                            <div className="flex gap-3 iems-center">
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify text-xs font-bold">CBZ</div>
                                    <span className="text-sm text-forest">CBZ  . .... 4821</span>
                            </div>
                            <span className="text-xs text-founder/50">Default</span>
                            </div>
                            <button className="w-full text-sm text-champagne font-medium">+ Add new bank </button>
                    </div>
                </div>

                <button 
                disabled={Number(amount) > balance}
                onClick={() => alert(`Send ${amount} to CBZ - Cal Paystack Transfer API`)}
                className="w-ful bg-forest text-ivory rounded-[14px] py-4 font-semibold disabled: opacity-50"
                >
                        Continue + ${Number(amount) > balance}
                </button>
                <p className="text-[11px] text-center text-forest/50">Requires FaceID + PIN . PayStack secured</p>
            </div>
        </div>
    );
}