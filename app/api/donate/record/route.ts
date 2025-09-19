import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json();
    if (!session_id) return new Response('Missing session_id', { status: 400 });

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return new Response('Stripe not configured', { status: 400 });

    const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return new Response('Not paid', { status: 400 });
    }

    const meta = session.metadata || {};
    const supabaseUrl = process.env.SUPABASE_URL as string;
    const supabaseService = (process.env.SUPABASE_SERVICE_ROLE as string) || (process.env.SUPABASE_SERVICE_ROLE_KEY as string);
    if (!supabaseUrl || !supabaseService) {
      return new Response('Supabase not configured', { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseService, { auth: { persistSession: false } });
    const payload = {
      stripe_session_id: session.id,
      amount: Number(meta.amount || 0),
      recipient: meta.recipient || null,
      message: meta.message || null,
      week: meta.week ? Number(meta.week) : null,
      game_id: meta.gameId || null,
      status: 'paid',
    };
    const { error } = await supabase.from('donations').insert(payload);
    if (error) {
      return new Response(`DB error: ${error.message}`, { status: 500 });
    }
    return Response.json({ ok: true, donation: payload });
  } catch (e: any) {
    return new Response(e?.message || 'Error', { status: 400 });
  }
}
