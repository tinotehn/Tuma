"use client";

import { ArrowLeft, Check, Search, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ZIM_BANKS = [
  { id: "cbz", name: "CBZ Bank", logo: "CBZ", color: "#0B3D26" },
  { id: "steward", name: "Steward Bank", logo: "S", color: "#007A33" },
  { id: "zb", name: "ZB Bank", logo: "ZB", color: "#E30613" },
  { id: "fbc", name: "FBC Bank", logo: "FB", color: "#00205B" },
  { id: "stanbic", name: "Stanbic Bank", logo: "SB", color: "#0033A0" },
  { id: "ecobank", name: "EcoBank", logo: "EB", color: "#00843D" },
];

const MOBILE_MONEY = [
  { id: "ecocash", name: "EcoCash", logo: "E", color: "#E60000", prefix: "077/078" },
  { id: "onemoney", name: "OneMoney", logo: "O", color: "#FF6A00", prefix: "071" },
  { id: "telecash", name: "TeleCash", logo: "T", color: "#0072BC", prefix: "073" },
];

export default function LinkInstitutionPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filteredBanks = ZIM_BANKS.filter((bank) =>
    bank.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredMobile = MOBILE_MONEY.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedInstitution = [...ZIM_BANKS, ...MOBILE_MONEY].find(
    (item) => item.id === selected
  );

  const handleConnect = () => {
    if (!selectedInstitution) return;
    
    // Add your connection logic here (e.g., API call or navigation)
    alert(`Successfully initiating connection to ${selectedInstitution.name}!`);
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] flex flex-col">
      <div className="bg-[#0B3D26] text-white px-6 pt-12 pb-8 rounded-b-[32px]">
        <div className="flex items-center justify-between mb-6">
          <button 
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" 
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <span className="text-[#0B3D26] font-bold text-xs">P</span>
            </div>
            <span className="font-bold text-sm tracking-widest">TUMA</span>
          </div>
          <button 
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" 
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <h1 className="text-[28px] font-black leading-tight">Select your Institution</h1>
        <p className="text-white/70 mt-2 text-sm">Link your Zimbabwe bank to get started</p>
      </div>

      <div className="px-5 -mt-6 pb-10">
        <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-4 flex items-center gap-3 border border-black/5">
          <Search size={18} className="text-black/40" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Banks"
            className="flex-1 outline-none text-[15px] placeholder:text-black/30 bg-transparent"
          />
        </div>

        <div className="mt-8">
          <h3 className="text-xs font-bold tracking-widest text-black/50 uppercase mb-3">Banks</h3>
          <div className="grid grid-cols-3 gap-3">
            {filteredBanks.map((bank) => (
              <button
                key={bank.id}
                type="button"
                onClick={() => setSelected(bank.id)}
                className={`bg-white rounded-[16px] px-3 py-3 border-2 flex flex-col items-center gap-2 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.04)] ${
                  selected === bank.id ? "border-[#0B3D26] bg-[#0B3D26]/5" : "border-black/5"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white font-black text-[10px]"
                  style={{ background: bank.color }}
                >
                  {bank.logo}
                </div>
                <span className="text-[11px] font-bold text-center leading-tight text-forest">{bank.name}</span>
                {selected === bank.id && (
                  <div className="w-5 h-5 bg-[#0B3D26] rounded-full flex items-center justify-center">
                    <Check size={12} className="text-[#C4A669]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xs font-bold tracking-widest text-black/50 uppercase mb-3">Mobile Money</h3>
          <div className="grid grid-cols-3 gap-3">
            {filteredMobile.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item.id)}
                className={`bg-white rounded-[16px] p-3 border-2 flex flex-col items-center gap-2 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.04)] ${
                  selected === item.id ? "border-[#0B3D26] bg-[#0B3D26]/5" : "border-black/5"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white font-black"
                  style={{ background: item.color }}
                >
                  {item.logo}
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-bold block text-forest">{item.name}</span>
                  <span className="text-[9px] text-black/40">{item.prefix}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!selected}
          onClick={handleConnect}
          className="w-full mt-10 bg-[#0B3D26] disabled:bg-black/20 text-[#C4A669] disabled:text-black/40 font-black py-5 rounded-[24px] text-[16px] shadow-[0_8px_20px_rgba(11,61,38,0.3)] transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {selectedInstitution ? `Connect ${selectedInstitution.name}` : "Select a bank"}
        </button>

        <p className="text-center text-[11px] text-black/40 mt-4 pb-10">
          Secured by Paynow Encrypted 256-bit SSL
        </p>
      </div>
    </div>
  );
}