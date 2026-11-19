import { NextRequest, NextResponse } from "next/server";
import { paynowClient } from "@/lib/paynow/client";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase server-side client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const pollUrl = formData.get("pollurl") as string;

        if (!pollUrl) {
            return NextResponse.json({ error: "Missing pollurl" }, { status: 400 });
        }

        // WALL: Verify directly on Paynow's servers — never trust client callbacks alone
        const transaction = await paynowClient.pollTransaction(pollUrl);

        const reference = transaction.reference();
        const amount = transaction.amount();
        const paynowReference = transaction.paynowReference();
        
        // Determine status string or methods from the Paynow SDK response object
        // (Typically: transaction.status() or evaluated helper methods)
        const status = transaction.status()?.toLowerCase() || "";

        console.log(`Paynow Webhook: Ref: ${reference} | Status: ${status} | Amount: ${amount}`);

        let dbStatus = "PENDING";
        let shouldNotifyWhatsApp = false;

        if (transaction.paid()) {
            dbStatus = "PAID";
            shouldNotifyWhatsApp = true;
            console.log(`[PAID] Successful transaction for ref: ${reference}`);
        } else if (status === "cancelled" || status === "failed") {
            dbStatus = "FAILED";
            shouldNotifyWhatsApp = true; // Optional: notify user of failure if needed
        } else if (status === "sent" || status === "created") {
            dbStatus = "PENDING";
        } else {
            // Fallback for custom or unhandled states
            dbStatus = status.toUpperCase();
        }

        // 1. Update Supabase payments table with the resolved status
        const { error: dbError } = await supabase
            .from("payments")
            .update({ 
                status: dbStatus, 
                paynow_reference: paynowReference,
                updated_at: new Date().toISOString()
            })
            .eq("poll_url", pollUrl);

        if (dbError) {
            console.error("Supabase Update Error:", dbError.message);
            return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }

        // 2. Trigger WhatsApp notification via internal API route if criteria is met
        if (shouldNotifyWhatsApp) {
            try {
                const host = req.headers.get("host") || "localhost:3000";
                const protocol = req.headers.get("x-forwarded-proto") || "http";
                
                await fetch(`${protocol}://${host}/api/rent/notify`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-internal-secret": process.env.INTERNAL_API_SECRET || ""
                    },
                    body: JSON.stringify({
                        reference,
                        amount,
                        status: dbStatus,
                        paynowReference
                    }),
                });
            } catch (notifyErr) {
                console.error("Failed to trigger WhatsApp notification:", notifyErr);
            }
        }

        return NextResponse.json({ ok: true, status: dbStatus });

    } catch (err: any) {
        console.error("Paynow webhook error:", err.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}