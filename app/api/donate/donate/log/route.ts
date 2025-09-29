import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// Note: Do not create the Supabase client at module scope to avoid
// build-time failures when env vars are not present in CI.

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

    // Initialize Supabase lazily with server-side credentials
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE =
      process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      console.error(
        "Missing Supabase env: SUPABASE_URL or SUPABASE_SERVICE_ROLE(_KEY)"
      );
      return NextResponse.json(
        { error: "Server misconfiguration: Supabase not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
      auth: { persistSession: false },
    });

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
