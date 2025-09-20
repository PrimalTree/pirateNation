import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";


const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE! // service role required for writes
);

export async function POST(req: Request) {
  try {
    const { recipient, playerId, message, amount } = await req.json();

    // Basic validation
    if (!recipient) {
      return NextResponse.json({ error: "Recipient is required" }, { status: 400 });
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: "Invalid donation amount" }, { status: 400 });
    }

    // Generate unique donation ID (to tie intent → PayPal confirmation)
    const donationId = randomUUID();

    // Insert as "pending"
    const { error } = await supabase.from("donations").insert({
      id: donationId,
      recipient,
      player_id: playerId || null,
      message,
      amount: amt,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ donationId });
  } catch (e: any) {
    console.error("Donation log failed:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
