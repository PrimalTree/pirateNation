import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import schedule from '../../../../data/public/schedule.json';

function getCurrentGameMeta() {
  try {
    const games = (schedule as any).games as Array<{ id: string; when: string }>;
    const now = Date.now();
    let idx = -1;
    let minDiff = Infinity;
    games.forEach((g, i) => {
      const t = new Date(g.when).getTime();
      const diff = Math.abs(t - now);
      if (diff < minDiff) { minDiff = diff; idx = i; }
    });
    const game = idx >= 0 ? games[idx] : undefined;
    return { week: idx + 1, gameId: game?.id };
  } catch {
    return { week: undefined as number | undefined, gameId: undefined as string | undefined };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { recipient, message, amount } = await req.json();
    if (!['OMVP', 'DMVP', 'TEAM'].includes(recipient)) {
      return new Response('Invalid recipient', { status: 400 });
    }
    const validAmounts = [5, 10, 25, 50, 100];
    if (!validAmounts.includes(Number(amount))) {
      return new Response('Invalid amount', { status: 400 });
    }
    const msg = (message ?? '').toString().slice(0, 250);

    const origin = new URL(req.url).origin;
    const { week, gameId } = getCurrentGameMeta();

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      // If Stripe not configured, short-circuit with a local thank-you link (dev fallback)
      const thankUrl = `${origin}/support/help/thank-you?mock=1&amount=${Number(amount)}&recipient=${encodeURIComponent(recipient)}`;
      return Response.json({ url: thankUrl });
    }

    const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${origin}/support/help/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/support/help`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: { name: `Donation (${recipient})` },
            unit_amount: Number(amount) * 100,
          },
        },
      ],
      client_reference_id: gameId,
      metadata: {
        recipient,
        message: msg,
        week: week ? String(week) : '',
        gameId: gameId ?? '',
        amount: String(amount),
      },
    });

    return Response.json({ url: session.url });
  } catch (e: any) {
    return new Response(`Error: ${e?.message || 'Bad request'}`, { status: 400 });
  }
}
