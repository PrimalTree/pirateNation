import type { NextConfig } from 'next';
import { config as loadEnv } from 'dotenv';
import path from 'path';

// Load env from repo root so both apps share .env/.env.local
loadEnv({ path: path.join(__dirname, '..', '..', '.env') });
loadEnv({ path: path.join(__dirname, '..', '..', '.env.local') });

const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true
  },
  transpilePackages: ['@pn/ui', '@pirate-nation/types'],
  env
};

export default nextConfig;
