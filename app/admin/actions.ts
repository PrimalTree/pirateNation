"use server";

export async function triggerLive(): Promise<{ ok: boolean; error?: string }> {
  try {
    const secret = process.env.CRON_SECRET || '';
    if (!secret) return { ok: false, error: 'CRON_SECRET not set' };
    const base = process.env.CRON_URL || 'http://localhost:3000/api/cron/fetchScores';
    const url = new URL(base);
    url.searchParams.set('secret', secret);
    const res = await fetch(url.toString(), { method: 'POST', cache: 'no-store' });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

