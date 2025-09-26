// TypeScript declaration for import.meta in Jest tests
declare global {
  interface ImportMeta {
    env: {
      VITE_USE_MOCK_API?: string;
      VITE_USE_STAGING?: string;
      VITE_VERCEL_ENV?: string;
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      VITE_SUPABASE_STAGING_URL?: string;
      VITE_SUPABASE_STAGING_ANON_KEY?: string;
    };
  }
}

export {};
