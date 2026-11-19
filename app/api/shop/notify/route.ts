import { NextRequest, NextResponse } from "next/server";
import { sendWhatsApp } from "@/lib/whatsapp/templates"; // Ensure this matches your actual helper function name

export async function POST(req: NextRequest) {
    try {
        const { ownerPhone, customerPhone, cart, total, orderId } = await req.json();

        // 1. Fixed .json('\n') to .join('\n') and fixed property name (.price instead of .parse assuming it's an item price)
        const items = cart.map((c: any) => `${c.name} $${c.price || c.parse}`).join('\n');
        
        const shortOrderId = orderId?.slice(0, 6) || 'N/A';

        // 2. Notify the shop owner
        await sendWhatsApp(
            ownerPhone, 
            `🛒 NEW TUMA ORDER #${shortOrderId}\nCustomer: ${customerPhone}\n\n${items}\n\nTotal: $${total}\n\nReply YES to confirm`
        );

        // 3. Notify the customer
        await sendWhatsApp(
            customerPhone, 
            `Order #${shortOrderId} sent to shop! Owner will message you in 5 mins. Track at tuma.co.zw/history`
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Tuma order webhook error:", error);
        return NextResponse.json({ ok: false, error: "Failed to process order" }, { status: 500 });
    }
}