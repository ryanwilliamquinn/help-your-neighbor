// Jest mock for config/env module
// This provides controlled environment variable values for tests

export const getEnvVar = (key: string): string | undefined => {
  // Return controlled values for Jest tests
  switch (key) {
    case 'VITE_USE_MOCK_API':
      return 'true'; // Always use mock API in tests
    case 'VITE_SUPABASE_URL':
      return ''; // Empty for tests
    case 'VITE_SUPABASE_ANON_KEY':
      return ''; // Empty for tests
    default:
      return undefined;
  }
};
