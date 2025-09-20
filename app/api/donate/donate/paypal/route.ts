import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { recipient, playerId, message, amount } = await req.json();

    // Validate amount
    if (![5, 10, 25, 50, 100].includes(amount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Create order with PayPal API
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
    ).toString("base64");

    const orderRes = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: amount.toString() },
            description: `Donation to ${recipient}${
              recipient === "PLAYER" ? ` (Player ID: ${playerId})` : ""
            }${message ? `: ${message}` : ""}`,
          },
        ],
        application_context: {
          brand_name: "Purple Armada",
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/donate/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/donate/cancel`,
        },
      }),
    });

    if (!orderRes.ok) {
      return NextResponse.json(
        { error: `PayPal order creation failed (${orderRes.status})` },
        { status: 500 }
      );
    }

    const order = await orderRes.json();
    const approvalUrl = order.links?.find((l: any) => l.rel === "approve")?.href;

    return NextResponse.json({ url: approvalUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
