export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const publicUrl = new URL('/maps/stadium-map.json', request.url);
    const upstream = await fetch(publicUrl.toString(), {
      // We fetch from public assets; rely on explicit cache headers below
      cache: 'force-cache',
    });
    if (!upstream.ok) {
      return new Response('Not found', { status: 404 });
    }
    const data = await upstream.json();

    const headers = new Headers({
      'content-type': 'application/json; charset=utf-8',
      // Cache for browsers 60s; CDN 10m; allow 1d stale-while-revalidate
      'cache-control': 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400',
    });

    return new Response(JSON.stringify(data), { headers });
  } catch (e: any) {
    return new Response(`Error: ${e?.message || e}`, { status: 500 });
  }
}

