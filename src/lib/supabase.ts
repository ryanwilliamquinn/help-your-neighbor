import { createClient } from '@supabase/supabase-js';

// Environment variable validation
function validateEnvironmentVariables(): {
  supabaseUrl: string;
  supabaseAnonKey: string;
  shouldUseStaging: boolean;
} {
  // Check if we're in test environment (Jest sets NODE_ENV to 'test')
  const isTestEnvironment =
    typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

  // Safe access to import.meta.env with fallbacks for test environment
  const getEnvVar = (key: string): string | undefined => {
    if (isTestEnvironment) {
      // Return mock values for test environment
      if (key === 'VITE_USE_MOCK_API') return 'true';
      return undefined;
    }

    // Use a safer approach that works in both dev and production
    try {
      // This will be replaced by Vite during build with actual values
      const globalThisWithImport = globalThis as {
        import?: { meta?: { env?: Record<string, string> } };
      };
      const windowWithViteEnv =
        typeof window !== 'undefined'
          ? (window as { __VITE_ENV__?: Record<string, string> })
          : null;

      const env =
        globalThisWithImport.import?.meta?.env ||
        windowWithViteEnv?.__VITE_ENV__;
      if (env) return env[key];

      // Fallback for runtime access
      return eval('import.meta.env')?.[key];
    } catch {
      return undefined;
    }
  };

  const useMockApi = getEnvVar('VITE_USE_MOCK_API');
  const useStaging = getEnvVar('VITE_USE_STAGING') === 'true';
  const isPreview = getEnvVar('VITE_VERCEL_ENV') === 'preview';

  // Use staging credentials for preview deployments or when explicitly requested
  const shouldUseStaging = isPreview || useStaging;

  const supabaseUrl = shouldUseStaging
    ? getEnvVar('VITE_SUPABASE_STAGING_URL')
    : getEnvVar('VITE_SUPABASE_URL');

  const supabaseAnonKey = shouldUseStaging
    ? getEnvVar('VITE_SUPABASE_STAGING_ANON_KEY')
    : getEnvVar('VITE_SUPABASE_ANON_KEY');

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
      console.log('Use mock API:', eval('import.meta.env')?.VITE_USE_MOCK_API);
    }
  } catch {
    console.log('Use mock API:', 'unavailable');
  }
  // eslint-disable-next-line no-console
  console.log('Environment:', shouldUseStaging ? 'staging' : 'production');
}
