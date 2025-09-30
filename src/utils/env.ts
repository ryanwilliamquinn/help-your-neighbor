// Environment variable utility that works in both browser and test environments

export function getEnvVar(name: string): string | undefined {
  // In Node environment (including tests), use process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }

  // In browser, return undefined - we'll detect environment differently
  return undefined;
}

// Helper to check if we're in a development environment
export function isDevelopment(): boolean {
  // In Node environment, use NODE_ENV
  const nodeEnv = getEnvVar('NODE_ENV');
  if (nodeEnv) {
    return nodeEnv !== 'production';
  }

  // In browser, assume development if localhost
  if (typeof window !== 'undefined') {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('localhost')
    );
  }

  return true; // Default to development
}

// Helper to check if we're in a test environment
export function isTest(): boolean {
  return getEnvVar('NODE_ENV') === 'test';
}
