import { NextResponse } from 'next/server';

export async function GET() {
  // Placeholder: return empty list
  return NextResponse.json([]);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // Placeholder: echo back
  return NextResponse.json({ ok: true, body });
}

