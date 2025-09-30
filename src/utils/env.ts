// Environment variable utility that works in both browser and test environments

export function getEnvVar(name: string): string | undefined {
  // In test/Node environment, use process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }

  // In browser/Vite environment, try to access import.meta.env safely
  if (typeof window !== 'undefined') {
    // This approach avoids the import.meta issue during Jest compilation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viteEnv = (globalThis as any).__VITE_ENV__;
    if (viteEnv && viteEnv[name]) {
      return viteEnv[name];
    }

    // Fallback: access import.meta.env at runtime (not during compilation)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const importMeta = (globalThis as any).import?.meta;
      if (importMeta?.env) {
        return importMeta.env[name];
      }
    } catch {
      // Silent fallback
    }
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
