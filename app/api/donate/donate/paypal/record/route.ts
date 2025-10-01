import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    throw new Error("PayPal env not configured");
  }
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`PayPal auth failed (${res.status})`);
  }
  const json = await res.json();
  return json.access_token as string;
}

async function getPayPalOrder(orderId: string, accessToken: string) {
  const res = await fetch(
    `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error(`PayPal order lookup failed (${res.status})`);
  }
  return res.json();
}

export async function POST(req: Request) {
  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE =
      process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Verify order with PayPal
    const token = await getPayPalAccessToken();
    const order = await getPayPalOrder(order_id, token);

    const status: string = order?.status;
    const unit = Array.isArray(order?.purchase_units)
      ? order.purchase_units[0]
      : undefined;
    const valueStr: string | undefined = unit?.amount?.value;
    const amount = valueStr ? Number(valueStr) : NaN;
    const customRaw: string | undefined = unit?.custom_id;

    if (status !== "COMPLETED") {
      return NextResponse.json(
        { error: `Order not completed: ${status}` },
        { status: 400 }
      );
    }
    if (!Number.isFinite(amount)) {
      return NextResponse.json(
        { error: "Invalid amount on order" },
        { status: 400 }
      );
    }

    let meta: any = {};
    try {
      if (customRaw) meta = JSON.parse(customRaw);
    } catch {
      meta = {};
    }

    const recipient: string | null = meta?.recipient || meta?.type || null; // e.g., TEAM/PLAYER
    const athleteId: string | null = meta?.athleteId || null;
    let message: string | null = meta?.message || null;
    if (!message && recipient === 'PLAYER' && athleteId) {
      message = `player:${athleteId}`;
    }
    const week: number | null = typeof meta?.week === "number" ? meta.week : null;
    const game_id: string | null = meta?.gameId || null;

    // Insert donation as paid
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
      auth: { persistSession: false },
    });
    const payload = {
      stripe_session_id: order_id, // reuse column as generic payment_id
      amount,
      recipient,
      message,
      week,
      game_id,
      status: "paid" as const,
    };
    const { error } = await supabase.from("donations").insert(payload);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, donation: payload });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
