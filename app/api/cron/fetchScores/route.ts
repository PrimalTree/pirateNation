import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret') || '';
    const expected = process.env.CRON_SECRET || '';
    if (!expected || secret !== expected) {
      return new Response('Forbidden', { status: 403 });
    }
    // Delegate to the main cron route to avoid duplication
    const forward = new URL(req.url);
    forward.pathname = '/api/cron/live';
    forward.search = '';
    forward.searchParams.set('token', secret);
    const res = await fetch(forward.toString(), { method: 'GET', cache: 'no-store' });
    return new Response(await res.text(), { status: res.status, headers: res.headers });
  } catch (e: any) {
    return new Response(`Error: ${e?.message || e}`, { status: 500 });
  }
}

export function GET() {
  return new Response('Method Not Allowed', { status: 405 });
}

