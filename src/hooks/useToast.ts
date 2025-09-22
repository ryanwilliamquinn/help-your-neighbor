import { useCallback } from 'react';
import { useToastContext } from '@/contexts/ToastContext';
import type { Toast } from '@/contexts/ToastContext';

/**
 * Toast convenience methods interface
 */
export interface ToastMethods {
  /** Show a success toast */
  success: (message: string, duration?: number) => void;
  /** Show an error toast */
  error: (message: string, duration?: number) => void;
  /** Show a warning toast */
  warning: (message: string, duration?: number) => void;
  /** Show an info toast */
  info: (message: string, duration?: number) => void;
  /** Remove a specific toast by ID */
  remove: (id: string) => void;
  /** Get all current toasts */
  toasts: Toast[];
}

/**
 * Hook that provides convenient methods for showing toast notifications
 *
 * @example
 * ```typescript
 * const toast = useToast();
 *
 * // Show different types of toasts
 * toast.success("Operation completed successfully!");
 * toast.error("Something went wrong");
 * toast.warning("Please check your input");
 * toast.info("New feature available");
 *
 * // With custom duration
 * toast.success("Quick message", 2000);
 *
 * // Remove specific toast
 * toast.remove(toastId);
 * ```
 *
 * @returns Object with toast methods and current toasts
 * @throws Error if used outside ToastProvider
 */
export const useToast = (): ToastMethods => {
  const { toasts, addToast, removeToast } = useToastContext();

  /**
   * Show a success toast notification
   */
  const success = useCallback(
    (message: string, duration?: number): void => {
      addToast({
        type: 'success',
        message,
        duration,
      });
    },
    [addToast]
  );

  /**
   * Show an error toast notification
   */
  const error = useCallback(
    (message: string, duration?: number): void => {
      addToast({
        type: 'error',
        message,
        duration,
      });
    },
    [addToast]
  );

  /**
   * Show a warning toast notification
   */
  const warning = useCallback(
    (message: string, duration?: number): void => {
      addToast({
        type: 'warning',
        message,
        duration,
      });
    },
    [addToast]
  );

  /**
   * Show an info toast notification
   */
  const info = useCallback(
    (message: string, duration?: number): void => {
      addToast({
        type: 'info',
        message,
        duration,
      });
    },
    [addToast]
  );

  /**
   * Remove a specific toast by ID
   */
  const remove = useCallback(
    (id: string): void => {
      removeToast(id);
    },
    [removeToast]
  );

  return {
    success,
    error,
    warning,
    info,
    remove,
    toasts,
  };
};

export default useToast;
