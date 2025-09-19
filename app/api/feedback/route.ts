import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entry = {
      at: new Date().toISOString(),
      ip: (req as any).ip || undefined,
      category: body?.category ?? 'other',
      email: body?.email ?? null,
      message: String(body?.message ?? ''),
      meta: body?.meta ?? null,
    };
    if (!entry.message || entry.message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'message required' }), { status: 400 });
    }
    const file = path.join(process.cwd(), 'data', 'feedback.log');
    const line = JSON.stringify(entry) + '\n';
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.appendFile(file, line, 'utf8');
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'failed' }), { status: 500 });
  }
}

