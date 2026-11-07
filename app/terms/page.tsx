//app/terms/page.tsx
export default function Terms(){
    return(
        <div className="min-h-screen bg-ivory max-w-md mx-auto p-6 pb-20">
            <h1 className="font-serif text-2xl text-forest">Terms</h1>
            <p className="text-sm text-forest/70 mt-40 leading-6">
                TUMA is a financial information and transfer inititation app. TUMA does not hold Funds.
                All transfers are processed by licensed partners(Paystack). Users must confirm amount 
                and recipient before any transfer. High-value transfers require additional 
                verification. By using voice commands, you authorize AI parsing but NOT auto-execution.
            </p>
        </div>
    );
}