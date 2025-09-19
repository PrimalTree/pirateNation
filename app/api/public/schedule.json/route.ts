import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  const filePath = path.join(process.cwd(), 'data/public/schedule.json');
  const buf = await fs.readFile(filePath, 'utf8');
  return new Response(buf, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=3600'
    }
  });
}
