import Link from "next/link";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-ivory p-4 pb-20 max-w-md mx-auto">
      <header className="mt-8 mb-6">
        <p className="text-sm text-forest/60 font-sans">Good morning,</p>
        <h1 className="text-2xl font-serif font-bold text-forest">Tendai</h1>
      </header>

      <section className="bg-forest rounded-[20px] p-6 text-ivory relative overflow-hidden border border-champagne/20">
        <div className="absolute -top-10 right-0 w-32 h-32 bg-champagne/10 rounded-full blur-2xl" />
        <p className="text-xs bg-ivory/10 inline-block px-3 py-1 rounded-full">Total Balance</p>
        <h2 className="text-4xl font-serif mt-3">$2,450.00</h2>
        <p className="text-xs text-ivory/60 mt-1">Available • Updated just now • + 2.4% this month</p>

        <div className="flex gap-3 mt-5">
          <button className="flex-1 bg-ivory text-forest rounded-full py-3 text-sm font-semibold">
            + Add Money
          </button>
          <Link
            href="/send/peer"
            className="flex-1 bg-champagne text-forest rounded-full py-3 text-sm font-semibold text-center"
          >
            Transfer
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="font-serif text-lg text-forest mt-6 mb-3">Linked Bank Accounts</h3>
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-forest/10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                CBZ
              </div>
              <div>
                <p className="font-semibold text-forest text-sm">CBZ Bank</p>
                <p className="text-xs text-forest/50">4821 Zimbabwe</p>
              </div>
            </div>
            <p className="font-semibold text-forest">$1,200.00</p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="font-serif text-lg text-forest mt-6 mb-3">Recent Activity</h3>
        <div className="bg-white rounded-2xl border border-forest/10 divide-y divide-forest/5">
          <div className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-forest">Pick n Pay</p>
              <p className="text-xs text-forest/50">Today 10:32 am</p>
            </div>
            <p className="text-sm font-semibold text-red-600">-$42.50</p>
          </div>
          <div className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-forest">Econet Payroll</p>
              <p className="text-xs text-forest/50">Yesterday • Salary</p>
            </div>
            <p className="text-sm font-semibold text-green-700">$1,800.00</p>
          </div>
        </div>
      </section>
    </main>
  );
}
