import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@shared/supabase-server';

export const runtime = 'nodejs';

function getServiceClient() {
  const url = process.env.SUPABASE_URL as string;
  const service = (process.env.SUPABASE_SERVICE_ROLE as string) || (process.env.SUPABASE_SERVICE_ROLE_KEY as string);
  if (!url || !service) throw new Error('Missing Supabase service env');
  return createClient(url, service, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('polls')
      .select('id,question,options,allow_anonymous,is_active,created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const server = await createSupabaseServer();
    const { data: auth } = await server.auth.getUser();
    if (!auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: profile } = await server
      .from('profiles')
      .select('role')
      .eq('user_id', auth.user.id)
      .maybeSingle();
    const role = profile?.role ?? 'user';
    if (!['admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const question = String(body?.question ?? '').trim();
    const optionsIn = body?.options;
    const options = Array.isArray(optionsIn)
      ? optionsIn.map((s: any) => String(s)).filter((s: string) => s.trim().length > 0)
      : [];
    if (!question || options.length < 2) {
      return NextResponse.json({ error: 'question and at least 2 options required' }, { status: 400 });
    }
    const allow_anonymous = body?.allow_anonymous !== undefined ? Boolean(body.allow_anonymous) : true;
    const is_active = body?.is_active !== undefined ? Boolean(body.is_active) : true;

    const svc = getServiceClient();
    const { data, error } = await svc
      .from('polls')
      .insert({ question, options, allow_anonymous, is_active })
      .select('id,question,options,allow_anonymous,is_active,created_at')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, poll: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}

