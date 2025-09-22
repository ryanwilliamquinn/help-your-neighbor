import { createClient } from '@supabase/supabase-js';

// Environment variable validation
function validateEnvironmentVariables(): {
  supabaseUrl: string;
  supabaseAnonKey: string;
} {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const useMockApi = import.meta.env.VITE_USE_MOCK_API;

  // If using mock API, Supabase vars are optional
  if (useMockApi === 'true') {
    return { supabaseUrl: '', supabaseAnonKey: '' };
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

  return { supabaseUrl, supabaseAnonKey };
}

const { supabaseUrl, supabaseAnonKey } = validateEnvironmentVariables();

// Only create client if not using mock API
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
