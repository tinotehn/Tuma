"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function HistoryPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: billData } = await supabase.from("bill_payments").select("*").order("created_at", { ascending: false }).limit(100);
      const { data: txData } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(50);

      setBills(billData || []);
      setTxs(txData || []);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <div className="p-6">Loading Tuma history...</div>;
  }

  const totalRent = bills
    .filter((bill) => bill.biller_id === "RENTAL" && bill.status === "SUCCESS")
    .reduce((sum, bill) => sum + Number(bill.amount), 0);

  const totalAll = bills
    .filter((bill) => bill.status === "SUCCESS")
    .reduce((sum, bill) => sum + Number(bill.amount), 0);

  const commission = bills.reduce((sum, bill) => sum + Number(bill.commission_earned || 0), 0);
  const saved = bills.filter((bill) => bill.verified_by_ai).length;
  const thisMonth = bills
    .filter((bill) => bill.created_at?.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, bill) => sum + Number(bill.amount), 0);

  const byBiller: Record<string, number> = {};
  bills.forEach((bill) => {
    byBiller[bill.biller_id] = (byBiller[bill.biller_id] || 0) + Number(bill.amount);
  });

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold">Tuma Earnings Dashboard 🇿🇼</h1>
        <p className="text-zinc-500 text-sm mt-1">Landlord / Shop Owner view — Powered by Paynow + Gemini AI</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded-xl shadow border">
            <p className="text-xs text-zinc-500">THIS MONTH COLLECTED</p>
            <p className="text-2xl font-bold">${thisMonth.toFixed(2)}</p>
            <p className="text-xs text-green-600 mt-1">All billers</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border">
            <p className="text-xs text-zinc-500">RENT COLLECTED</p>
            <p className="text-2xl font-bold">${totalRent.toFixed(2)}</p>
            <p className="text-xs text-zinc-500 mt-1">{bills.filter((bill) => bill.biller_id === "RENTAL").length} payments</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border">
            <p className="text-xs text-zinc-500">YOUR COMMISSION</p>
            <p className="text-2xl font-bold text-green-700">${commission.toFixed(2)}</p>
            <p className="text-xs text-zinc-500 mt-1">From {bills.length} txs</p>
          </div>
          <div className="bg-black text-white p-4 rounded-xl shadow">
            <p className="text-xs text-zinc-300">AI FRAUD SAVED</p>
            <p className="text-2xl font-bold">{saved}</p>
            <p className="text-xs text-green-400 mt-1">🛡️ Gemini blocked wrong transfers</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="md:col-span-2 bg-white p-5 rounded-xl shadow border">
            <h2 className="font-semibold mb-3">Recent Payments (Last 100)</h2>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-zinc-500 border-b">
                  <tr>
                    <th className="py-2">Date</th>
                    <th>Biller</th>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id} className="border-b last:border-0">
                      <td className="py-2">
                        {new Date(bill.created_at).toLocaleDateString()} {new Date(bill.created_at).toLocaleTimeString().slice(0, 5)}
                      </td>
                      <td>
                        <span className="px-2 py-0.5 bg-zinc-100 rounded text-xs">{bill.biller_id}</span>
                      </td>
                      <td className="max-w-[140px] truncate">{bill.account_number}</td>
                      <td className="font-semibold">${Number(bill.amount).toFixed(2)}</td>
                      <td className="text-xs text-zinc-500">{bill.id.slice(0, 8)}</td>
                    </tr>
                  ))}
                  {bills.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-zinc-500">
                        No payments yet. Test with WhatsApp: type bills
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl shadow border">
              <h3 className="font-semibold mb-2">Collection by Type</h3>
              {Object.entries(byBiller).map(([key, value]) => (
                <div key={key} className="flex justify-between py-1.5 text-sm border-b last:border-0">
                  <span>{key}</span>
                  <span className="font-bold">${Number(value).toFixed(2)}</span>
                </div>
              ))}
              {Object.keys(byBiller).length === 0 && <p className="text-sm text-zinc-500">No data</p>}
            </div>

            <div className="bg-green-50 p-5 rounded-xl border border-green-200">
              <h3 className="font-semibold text-green-800">Pitch to Landlord</h3>
              <p className="text-sm mt-2 text-green-900">
                "You collected <b>${totalAll.toFixed(2)}</b> via WhatsApp. Tuma saved you from <b>{saved} failed transfers</b> with Gemini AI. No more screenshot proofs. Commission this month: <b>${commission.toFixed(2)}</b>."
              </p>
              <a href="/rental" className="mt-3 inline-block text-xs bg-black text-white px-3 py-1.5 rounded">
                View Rental Page
              </a>
            </div>

            <div className="bg-white p-5 rounded-xl shadow border">
              <h3 className="font-semibold mb-2">P2P Transfers (Send)</h3>
              <div className="space-y-2">
                {txs.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="text-xs flex justify-between gap-2">
                    <span>{tx.sender_number} → {tx.recipient_number}</span>
                    <span className="font-bold">${Number(tx.amount).toFixed(2)}</span>
                  </div>
                ))}
                {txs.length === 0 && <p className="text-xs text-zinc-500">No P2P yet</p>}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-8">
          Tuma — WhatsApp-native Paynow rail | EcoCash, OneMoney, InnBucks, O&apos;mari | RBZ-compliant logging
        </p>
      </div>
    </div>
  );
}
