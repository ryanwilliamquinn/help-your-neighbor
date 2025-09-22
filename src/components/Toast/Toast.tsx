import React, { useCallback } from 'react';
import type { Toast as ToastType } from '@/contexts/ToastContext';
import './Toast.css';

/**
 * Props for the Toast component
 */
export interface ToastProps {
  /** Toast data */
  toast: ToastType;
  /** Callback to remove the toast */
  onRemove: (id: string) => void;
  /** Whether the toast is being removed (for exit animation) */
  isRemoving?: boolean;
}

/**
 * Icon mapping for different toast types
 */
const TOAST_ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
} as const;

/**
 * ARIA role mapping for different toast types
 */
const TOAST_ROLES = {
  success: 'status',
  error: 'alert',
  warning: 'alert',
  info: 'status',
} as const;

/**
 * Individual toast notification component
 *
 * Displays a single toast notification with appropriate styling,
 * icon, and close functionality. Supports animations and accessibility.
 */
export const Toast: React.FC<ToastProps> = ({
  toast,
  onRemove,
  isRemoving = false,
}) => {
  /**
   * Handle close button click
   */
  const handleClose = useCallback(() => {
    onRemove(toast.id);
  }, [onRemove, toast.id]);

  /**
   * Handle keyboard events for accessibility
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    },
    [handleClose]
  );

  const toastClasses = [
    'toast',
    `toast--${toast.type}`,
    isRemoving && 'toast-exit',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={toastClasses}
      role={TOAST_ROLES[toast.type]}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      onKeyDown={handleKeyDown}
      data-testid={`toast-${toast.id}`}
      data-toast-type={toast.type}
    >
      <div className="toast__content">
        <span
          className="toast__icon"
          aria-hidden="true"
          data-testid={`toast-icon-${toast.id}`}
        >
          {TOAST_ICONS[toast.type]}
        </span>
        <span
          className="toast__message"
          data-testid={`toast-message-${toast.id}`}
        >
          {toast.message}
        </span>
      </div>
      <button
        type="button"
        className="toast__close"
        onClick={handleClose}
        aria-label={`Close ${toast.type} notification: ${toast.message}`}
        data-testid={`toast-close-${toast.id}`}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
