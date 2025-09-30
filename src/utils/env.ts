// Environment variable utility that works in both browser and test environments

export function getEnvVar(name: string): string | undefined {
  // In test/Node environment, use process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }

  // In browser/Vite environment, the env utility won't be used
  // since we're using serverless functions instead of frontend Resend
  if (typeof window !== 'undefined') {
    // Return undefined to force fallback to MockEmailService in browser
    return undefined;
  }

  return undefined;
}

// Helper to check if we're in a development environment
export function isDevelopment(): boolean {
  return getEnvVar('NODE_ENV') !== 'production';
}

// Helper to check if we're in a test environment
export function isTest(): boolean {
  return getEnvVar('NODE_ENV') === 'test';
}
