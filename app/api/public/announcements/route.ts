import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data/public/announcements.json');
    const buf = await fs.readFile(filePath, 'utf8');
    return new Response(buf, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ items: [] }), {
      headers: { 'content-type': 'application/json; charset=utf-8' },
      status: 200
    });
  }
}

