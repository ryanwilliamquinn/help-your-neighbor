// Mock Supabase client for tests
export const supabase = null;

// Mock validation function for tests
export function validateEnvironmentVariables(): {
  supabaseUrl: string;
  supabaseAnonKey: string;
  shouldUseStaging: boolean;
} {
  return {
    supabaseUrl: '',
    supabaseAnonKey: '',
    shouldUseStaging: false,
  };
}
