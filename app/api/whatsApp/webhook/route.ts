// app/api/whatsapp/webhook/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { BILLERS, getBillerMenu } from "@/app/lib/biller";
import { checkTransactionWithGemini } from "@/app/lib/geminiGuardian";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

async function sendWhatsApp(to: string, body: string) {
  await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      text: { body },
    }),
  });
}

function extractAmount(text: string) {
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? Number.parseFloat(match[0]) : 0;
}

export async function POST(req: Request) {
  const body = await req.json();
  const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg) return new Response("OK");

  const from = String(msg.from);
  const text = msg.text?.body?.trim() || "";
  const lower = text.toLowerCase();

  let { data: session } = await supabase
    .from("whatsapp_sessions")
    .select("*")
    .eq("whatsapp_number", from)
    .single();

  if (!session) {
    const { data: newSession } = await supabase
      .from("whatsapp_sessions")
      .insert({ whatsapp_number: from, state: null, temp_data: {} })
      .select()
      .single();
    session = newSession;
  }

  if (["bills", "pay bill", "bill", "rent", "shopping", "church"].includes(lower)) {
    await supabase
      .from("whatsapp_sessions")
      .update({ state: "AWAITING_BILLER_CHOICE", temp_data: {} })
      .eq("whatsapp_number", from);

    await sendWhatsApp(from, getBillerMenu());
    return new Response("OK");
  }

  if (session?.state === "AWAITING_BILLER_CHOICE") {
    const biller = BILLERS[text];
    if (!biller) {
      await sendWhatsApp(from, "Invalid. Reply 1-7");
      return new Response("OK");
    }

    await supabase
      .from("whatsapp_sessions")
      .update({ state: "AWAITING_BILL_ACCOUNT", temp_data: { biller_id: biller.id } })
      .eq("whatsapp_number", from);

    await sendWhatsApp(from, biller.prompt);
    return new Response("OK");
  }

  if (session?.state === "AWAITING_BILL_ACCOUNT") {
    await supabase
      .from("whatsapp_sessions")
      .update({ state: "AWAITING_BILL_AMOUNT", temp_data: { ...session.temp_data, account: text } })
      .eq("whatsapp_number", from);

    await sendWhatsApp(from, `Amount for ${session.temp_data.biller_id} - ${text}?\nExample: 100`);
    return new Response("OK");
  }

  if (session?.state === "AWAITING_BILL_AMOUNT") {
    const amount = extractAmount(text);
    const { biller_id, account } = session.temp_data as { biller_id: string; account: string };
    const candidateKey = Object.keys(BILLERS).find((key) => BILLERS[key].id === biller_id) ?? "1";
    const billerMeta = BILLERS[candidateKey] ?? { commission: 1.5 };
    const commission = amount * (billerMeta.commission / 100);

    const { data: past } = await supabase
      .from("bill_payments")
      .select("*")
      .eq("user_number", from)
      .eq("biller_id", biller_id)
      .limit(10);

    const check = await checkTransactionWithGemini({
      userNumber: from,
      recipientNumber: account,
      amount,
      pastTxs: past || [],
      context: `${biller_id} payment`,
    });

    if (check.shouldBlock) {
      await sendWhatsApp(from, `⚠️ ${check.risk} RISK: ${check.warningMessage}\n\nReply YES to pay $${amount} anyway or NO to cancel.`);
      await supabase
        .from("whatsapp_sessions")
        .update({ state: "AWAITING_CONFIRM_RISKY", temp_data: { ...session.temp_data, amount } })
        .eq("whatsapp_number", from);
      return new Response("OK");
    }

    const extra: Record<string, unknown> = { commission_earned: commission };
    if (biller_id === "RENTAL") {
      extra.property_id = account;
      extra.month_paid_for = new Date().toISOString().slice(0, 7);
    }
    if (biller_id === "SHOPPING") extra.shop_order_id = account;
    if (biller_id === "CHURCH") extra.property_id = account;

    const { data: bill } = await supabase
      .from("bill_payments")
      .insert({
        user_number: from,
        biller_id,
        account_number: account,
        amount,
        status: "SUCCESS",
        ...extra,
        verified_by_ai: true,
      })
      .select()
      .single();

    await supabase
      .from("whatsapp_sessions")
      .update({ state: null, temp_data: null })
      .eq("whatsapp_number", from);

    if (biller_id === "RENTAL") {
      await sendWhatsApp(from, `🏠 Rent $${amount} for ${account} PAID. Month: ${extra.month_paid_for}. Ref ${bill?.id?.slice(0, 8)}. Receipt saved in history.`);
    } else if (biller_id === "SHOPPING") {
      await sendWhatsApp(from, `🛒 Order ${account} $${amount} PAID. Shop will deliver. Ref ${bill?.id?.slice(0, 8)}.`);
    } else {
      await sendWhatsApp(from, `✅ $${amount} to ${biller_id} for ${account} PAID. Ref ${bill?.id?.slice(0, 8)}. Token/receipt coming via SMS.`);
    }
    return new Response("OK");
  }

  if (session?.state === "AWAITING_CONFIRM_RISKY" && lower === "yes") {
    const { biller_id, account, amount } = session.temp_data as { biller_id: string; account: string; amount: number };
    const { data: bill } = await supabase
      .from("bill_payments")
      .insert({
        user_number: from,
        biller_id,
        account_number: account,
        amount,
        status: "SUCCESS",
        verified_by_ai: true,
        commission_earned: amount * 0.02,
      })
      .select()
      .single();

    await supabase
      .from("whatsapp_sessions")
      .update({ state: null, temp_data: null })
      .eq("whatsapp_number", from);

    await sendWhatsApp(from, `✅ Confirmed. $${amount} PAID despite warning. Ref ${bill?.id?.slice(0, 8)}.`);
    return new Response("OK");
  }

  if (lower.startsWith("send")) {
    const amount = extractAmount(text);
    const to = text.match(/077\d+|078\d+|071\d+|263\d+/)?.[0] || "";

    if (!amount || !to) {
      await sendWhatsApp(from, "Use: send 10 to 077...");
      return new Response("OK");
    }

    const { data: past } = await supabase
      .from("transactions")
      .select("*")
      .eq("sender_number", from)
      .limit(20);

    const check = await checkTransactionWithGemini({
      userNumber: from,
      recipientNumber: to,
      amount,
      pastTxs: past || [],
    });

    if (check.shouldBlock) {
      await sendWhatsApp(from, `⚠️ ${check.warningMessage} Reply YES SEND to confirm.`);
      await supabase
        .from("whatsapp_sessions")
        .update({ state: "AWAITING_SEND_CONFIRM", temp_data: { to, amount } })
        .eq("whatsapp_number", from);
      return new Response("OK");
    }

    await supabase
      .from("transactions")
      .insert({ sender_number: from, recipient_number: to, amount, status: "SUCCESS", verified_by_ai: true });

    await sendWhatsApp(from, `💸 $${amount} sent to ${to}. Protected by Gemini.`);
    return new Response("OK");
  }

  await sendWhatsApp(
    from,
    "*Tuma - Your WhatsApp Wallet 🇿🇼*\n\n" +
      "• send 10 to 077... → Send money\n" +
      "• bills → ZESA, TelOne, Council, DSTV, RENT, Shopping, Church\n" +
      "• balance → Check wallet\n" +
      "• history → Last payments\n\n" +
      "All protected by Gemini AI 🛡️"
  );

  return new Response("OK");
}
