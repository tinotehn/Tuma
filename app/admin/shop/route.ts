import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (req.headers.get('x-internal-secret') !== process.env.INTERNAL_SECRET && !req.headers.get('authorization')) {
    // In production, check admin session here
  }
  const { name, ownerPhone, area, logo } = await req.json();
  if (!name || !ownerPhone) return NextResponse.json({ error: 'Missing' }, { status: 400 });
  if (!/^2637\d{8}$/.test(ownerPhone)) return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });

  const { data, error } = await supabaseAdmin.from('tuma_shops').insert({
    name, owner_phone: ownerPhone, area, logo: logo || '🛒',
    slug: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4)
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.slug });
}