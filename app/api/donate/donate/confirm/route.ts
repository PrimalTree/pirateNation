import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Lazily create Supabase inside handler to avoid build-time env failures

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Extract PayPal fields
    const txnId = body?.resource?.id;
    const status = body?.resource?.status;
    const amount = body?.resource?.amount?.value;
    const payerEmail = body?.resource?.payer?.email_address;

    // Find your donationId if you passed it along in PayPal "custom" or "invoice_id"
    const donationId = body?.resource?.invoice_id; // you must set this during redirect

    if (!txnId || !status || !donationId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (status.toLowerCase() === "completed") {
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

      await supabase
        .from("donations")
        .update({
          status: "confirmed",
          transaction_id: txnId,
          payer_email: payerEmail,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", donationId);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Webhook error", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
