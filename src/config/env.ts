// Environment variable access using direct import.meta.env syntax
// This allows Vite to perform proper build-time static replacement

export const getEnvVar = (key: string): string | undefined => {
  // In test environment, return mock values
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return key === 'VITE_USE_MOCK_API' ? 'true' : undefined;
  }

  // In browser environment, use direct import.meta.env access
  // Vite will statically replace these at build time
  switch (key) {
    case 'VITE_USE_MOCK_API':
      return import.meta.env.VITE_USE_MOCK_API;
    case 'VITE_USE_STAGING':
      return import.meta.env.VITE_USE_STAGING;
    case 'VITE_VERCEL_ENV':
      return import.meta.env.VITE_VERCEL_ENV;
    case 'VITE_SUPABASE_URL':
      return import.meta.env.VITE_SUPABASE_URL;
    case 'VITE_SUPABASE_ANON_KEY':
      return import.meta.env.VITE_SUPABASE_ANON_KEY;
    case 'VITE_SUPABASE_STAGING_URL':
      return import.meta.env.VITE_SUPABASE_STAGING_URL;
    case 'VITE_SUPABASE_STAGING_ANON_KEY':
      return import.meta.env.VITE_SUPABASE_STAGING_ANON_KEY;
    case 'VITE_AUTH_REDIRECT_URL':
      return import.meta.env.VITE_AUTH_REDIRECT_URL;
    default:
      return undefined;
  }
};
