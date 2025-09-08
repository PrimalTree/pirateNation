import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // Accepts { geojson }
  return NextResponse.json({ ok: true, received: !!body.geojson });
}

