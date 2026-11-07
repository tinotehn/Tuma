//
export default function Privacy(){
    return(
        <div className="min-h-screen bg-ivory max-w-md mx-auto p-6 pb-20">
            <h1 className="font-serif text-2xl text-forest">Privacy Policy</h1>
            <p className="text-sm text-forest mt-4 leading-6">
                We store: email, linked bank last -4, transfer history. We do NOT store full
                bank account numbers or passwords. Voice transcripts are parsed for amount/recipient only
                and are not stored.
                Contact: privacy@tuma.co.zw
            </p>
        </div>
    );
}