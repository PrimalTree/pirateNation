import roster from '../../../../data/public/roster.json';

export const runtime = 'edge';

export async function GET() {
  return new Response(JSON.stringify(roster), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, s-maxage=86400, stale-while-revalidate=3600'
    }
  });
}
