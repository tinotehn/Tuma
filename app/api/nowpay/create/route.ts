import { NextRequest, NextResponse } from "next/server";
import { paynowClient } from "@/lib/paynow/client";
import { redirect } from "next/dist/server/api-utils";
import { error } from "console";
import next from "next";

export async function POST(req: NextRequest){
    const {flatId, amount, phone} = await req.json();

    //CREATE PAYMENT REFERENCE
    const ref = `TUMA-${flatId}-${Date.now()}`;
    const payment = paynowClient.createPaymnet(ref,phone);
    payment.add(`Rent ${flatId}`,amount);
    
    try{
        const response = await paynowClient.send(payment);

        if (response.success){
            return NextResponse.json({
                success: true,
                redirectUrl: response.redirectUrl, //Ecocash page
                pollUrl: response.pollUrl
            });
        }else {
            return NextResponse.json({error: response.error}, {status:400});
        }
    }catch (err) {
        return NextResponse.json({error: 'Paynow send failed'}, {status: 500});
    }
}