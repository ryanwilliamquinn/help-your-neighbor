/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';

/**
 * Represents a toast notification
 */
export interface Toast {
  /** Unique identifier for the toast */
  id: string;
  /** Type determines styling and icon */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Message content to display */
  message: string;
  /** Optional duration override, defaults to 4000ms */
  duration?: number;
}

/**
 * Toast context value interface
 */
export interface ToastContextType {
  /** Array of currently active toasts */
  toasts: Toast[];
  /** Add a new toast notification */
  addToast: (toast: Omit<Toast, 'id'>) => void;
  /** Remove a toast by ID */
  removeToast: (id: string) => void;
}

/**
 * Toast context
 */
const ToastContext = createContext<ToastContextType | null>(null);

/**
 * Hook to access toast context
 */
export const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

/**
 * Props for ToastProvider component
 */
export interface ToastProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Maximum number of toasts to show at once, defaults to 5 */
  maxToasts?: number;
  /** Default duration for toasts in milliseconds, defaults to 4000 */
  defaultDuration?: number;
}

/**
 * Toast provider component that manages toast state and auto-removal
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
  defaultDuration = 4000,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Generate unique ID for toast
   */
  const generateId = useCallback((): string => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Remove a toast and clear its timeout
   */
  const removeToast = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));

    // Clear timeout if it exists
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  /**
   * Add a new toast with auto-removal
   */
  const addToast = useCallback(
    (toastData: Omit<Toast, 'id'>): void => {
      const id = generateId();
      const duration = toastData.duration ?? defaultDuration;

      const newToast: Toast = {
        ...toastData,
        id,
      };

      setToasts((prev) => {
        const updatedToasts = [newToast, ...prev];
        // Enforce max toasts limit by removing oldest toasts
        if (updatedToasts.length > maxToasts) {
          const toastsToRemove = updatedToasts.slice(maxToasts);
          toastsToRemove.forEach((toast) => {
            const timeout = timeoutsRef.current.get(toast.id);
            if (timeout) {
              clearTimeout(timeout);
              timeoutsRef.current.delete(toast.id);
            }
          });
          return updatedToasts.slice(0, maxToasts);
        }
        return updatedToasts;
      });

      // Set up auto-removal timeout
      const timeout = setTimeout(() => {
        removeToast(id);
      }, duration);

      timeoutsRef.current.set(id, timeout);
    },
    [generateId, defaultDuration, maxToasts, removeToast]
  );

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

export default ToastContext;
