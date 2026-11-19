import { NextRequest, NextResponse } from "next/server";
import { parseWithGemini } from "@/lib/parsers/geminiParser";
import { parseWithFallback } from "@/lib/parsers/fallbackParser";
import { secureValidate } from "@/lib/secureValidate";
import { sendWhatsApp } from "@/lib/whatsapp/sendMessage";

export async function GET(req: NextRequest) {
    const mode = req.nextUrl.searchParams.get("hub.mode");
    const token = req.nextUrl.searchParams.get("hub.verify_token");
    const challenge = req.nextUrl.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === process.env.VERIFIY_TOKEN && challenge !== null) {
        return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
    let phone: string | undefined;
    try {
        const body = await req.json();
        const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (!message) return NextResponse.json({ ok: true });

        phone = message.from;
        const text = message.text?.body || "";
        const userIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";

        let parsed;
        try {
            parsed = await parseWithGemini(text);
        } catch {
            parsed = await parseWithFallback(text);
        }

        const check = await secureValidate(parsed, userIp, parsed.pin || "0000");
        if (!check.valid) {
            await sendWhatsApp(phone, `X ${check.error}`);
            return NextResponse.json({ ok: true });
        }

        // TODO: Call Paynow before reporting a payment as completed.
        await sendWhatsApp(phone, `Request validated: $${check.sanitized.amount} for ${check.sanitized.biller}.`);
        return NextResponse.json({ ok: true });
    } catch {
        if (phone) await sendWhatsApp(phone, "Tuma is busy, try again in 1 min");
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}