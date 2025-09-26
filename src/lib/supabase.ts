import { createClient } from '@supabase/supabase-js';

// Environment variable validation
function validateEnvironmentVariables(): {
  supabaseUrl: string;
  supabaseAnonKey: string;
  shouldUseStaging: boolean;
} {
  const useMockApi = import.meta.env.VITE_USE_MOCK_API;
  const useStaging = import.meta.env.VITE_USE_STAGING === 'true';
  const isPreview = import.meta.env.VITE_VERCEL_ENV === 'preview';

  // Debug logging for environment variables
  if (typeof window !== 'undefined') {
    console.log('Environment debug:', {
      useMockApi,
      useStaging,
      isPreview,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    });
  }

  // Use staging credentials for preview deployments or when explicitly requested
  const shouldUseStaging = isPreview || useStaging;

  const supabaseUrl = shouldUseStaging
    ? import.meta.env.VITE_SUPABASE_STAGING_URL
    : import.meta.env.VITE_SUPABASE_URL;

  const supabaseAnonKey = shouldUseStaging
    ? import.meta.env.VITE_SUPABASE_STAGING_ANON_KEY
    : import.meta.env.VITE_SUPABASE_ANON_KEY;

  // If using mock API, Supabase vars are optional
  if (useMockApi === 'true') {
    return { supabaseUrl: '', supabaseAnonKey: '', shouldUseStaging };
  }

  // Validate required environment variables
  if (!supabaseUrl || typeof supabaseUrl !== 'string') {
    throw new Error(
      'VITE_SUPABASE_URL environment variable is required when VITE_USE_MOCK_API is false'
    );
  }

  if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string') {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY environment variable is required when VITE_USE_MOCK_API is false'
    );
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid URL');
  }

  // Basic validation for anon key format (should be long string)
  if (supabaseAnonKey.length < 32) {
    throw new Error('VITE_SUPABASE_ANON_KEY appears to be invalid (too short)');
  }

  // Ensure it's a supabase URL
  if (
    !supabaseUrl.includes('supabase.co') &&
    !supabaseUrl.includes('localhost')
  ) {
    // eslint-disable-next-line no-console
    console.warn('VITE_SUPABASE_URL does not appear to be a Supabase URL');
  }

  return { supabaseUrl, supabaseAnonKey, shouldUseStaging };
}

const { supabaseUrl, supabaseAnonKey, shouldUseStaging } =
  validateEnvironmentVariables();

// Only create client if not using mock API
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Debug logging for production
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('Supabase client initialized:', !!supabase);
  // eslint-disable-next-line no-console
  console.log('Supabase URL configured:', !!supabaseUrl);

  try {
    const isTest =
      typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if (isTest) {
      console.log('Use mock API:', 'true (test environment)');
    } else {
      const getImportMeta = new Function('return import.meta.env');
      console.log('Use mock API:', getImportMeta()?.VITE_USE_MOCK_API);
    }
  } catch {
    console.log('Use mock API:', 'unavailable');
  }
  // eslint-disable-next-line no-console
  console.log('Environment:', shouldUseStaging ? 'staging' : 'production');
}
