import map from '../../../../data/public/map.json';

export const runtime = 'edge';

export async function GET() {
  return new Response(JSON.stringify(map), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, s-maxage=86400, stale-while-revalidate=3600'
    }
  });
}
