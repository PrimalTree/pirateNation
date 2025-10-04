import 'dotenv/config';
import { NextRequest } from 'next/server';
import { createServiceRoleClient, syncLiveScores } from '../../../../cron/liveSync';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';
    const secret = process.env.CRON_SECRET || '';
    if (!secret || token !== secret) {
      return new Response('Forbidden', { status: 403 });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL as string;
    const SUPABASE_SERVICE_ROLE = (process.env.SUPABASE_SERVICE_ROLE as string) || (process.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const ADMIN_POLL_TOKEN = process.env.ADMIN_POLL_TOKEN as string | undefined;
    const LIVE_URL = (process.env.LIVE_SOURCE_URL as string) || 'https://api.example.com/live';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return new Response('Missing Supabase env', { status: 500 });
    }

    const supabase = createServiceRoleClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    const { total, updated } = await syncLiveScores({
      supabase,
      liveSourceUrl: LIVE_URL,
      adminPollToken: ADMIN_POLL_TOKEN,
    });

    return Response.json({ total, updated });
  } catch (e: any) {
    return new Response(`Error: ${e?.message || e}`, { status: 500 });
  }
}
