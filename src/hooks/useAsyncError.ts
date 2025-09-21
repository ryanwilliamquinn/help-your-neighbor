import { useCallback, useState } from 'react';

/**
 * Hook to capture async errors and forward them to error boundaries.
 * React error boundaries don't catch errors in async functions by default,
 * so this hook helps bridge that gap.
 */
export const useAsyncError = (): ((error: Error) => void) => {
  const [, setError] = useState<Error | null>(null);

  const throwAsyncError = useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);

  return throwAsyncError;
};

/**
 * Wrapper function to automatically catch async errors and forward them
 * to error boundaries via the useAsyncError hook.
 */
export const withAsyncErrorBoundary = <T extends unknown[], R>(
  asyncFn: (...args: T) => Promise<R>,
  throwAsyncError: (error: Error) => void
) => {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      throwAsyncError(
        error instanceof Error ? error : new Error(String(error))
      );
      return undefined;
    }
  };
};
