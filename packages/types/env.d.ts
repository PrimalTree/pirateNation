// Global environment variable typings for apps and packages
// Included via tsconfig: "types": ["@pirate-nation/types/env"]

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SITE_NAME: string;
    NEXT_PUBLIC_MAPBOX_TOKEN: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    POSTHOG_API_KEY: string;
    PLAUSIBLE_DOMAIN: string;
    WEB_PUSH_VAPID_PUBLIC_KEY: string;
    WEB_PUSH_VAPID_PRIVATE_KEY: string;
  }
}

// Optional: ImportMeta typing to avoid TS errors if used
interface ImportMetaEnv {
  readonly NEXT_PUBLIC_SITE_NAME: string;
  readonly NEXT_PUBLIC_MAPBOX_TOKEN: string;
  readonly NEXT_PUBLIC_SUPABASE_URL: string;
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly POSTHOG_API_KEY: string;
  readonly PLAUSIBLE_DOMAIN: string;
  readonly WEB_PUSH_VAPID_PUBLIC_KEY: string;
  readonly WEB_PUSH_VAPID_PRIVATE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
