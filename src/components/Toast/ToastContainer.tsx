import React from 'react';
import { useToastContext } from '@/contexts/ToastContext';
import Toast from './Toast';
import './ToastContainer.css';

/**
 * Props for ToastContainer component
 */
export interface ToastContainerProps {
  /** Position of the toast container, defaults to 'top-right' */
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  /** Custom className for the container */
  className?: string;
}

/**
 * Container component that renders all active toast notifications
 *
 * Manages the positioning and layout of multiple toasts, providing
 * a consistent visual hierarchy and animations. Automatically integrates
 * with the ToastContext to display active toasts.
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  className = '',
}) => {
  const { toasts, removeToast } = useToastContext();

  // Don't render container if no toasts
  if (toasts.length === 0) {
    return null;
  }

  const containerClasses = [
    'toast-container',
    `toast-container--${position}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClasses}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      data-testid="toast-container"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
