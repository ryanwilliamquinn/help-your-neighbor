import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useToast } from './useToast';
import { ToastProvider } from '@/contexts/ToastContext';

// Wrapper component for the hook
const createWrapper = (
  props: { maxToasts?: number; defaultDuration?: number } = {}
): React.FC<{ children: React.ReactNode }> => {
  const WrapperComponent: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) =>
    React.createElement(ToastProvider, {
      children,
      maxToasts: props.maxToasts,
      defaultDuration: props.defaultDuration,
    });
  return WrapperComponent;
};

describe('useToast Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Hook Integration', () => {
    it('should return toast methods and empty toasts array initially', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      expect(result.current).toHaveProperty('success');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('warning');
      expect(result.current).toHaveProperty('info');
      expect(result.current).toHaveProperty('remove');
      expect(result.current).toHaveProperty('toasts');

      expect(typeof result.current.success).toBe('function');
      expect(typeof result.current.error).toBe('function');
      expect(typeof result.current.warning).toBe('function');
      expect(typeof result.current.info).toBe('function');
      expect(typeof result.current.remove).toBe('function');
      expect(Array.isArray(result.current.toasts)).toBe(true);
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('Success Toast', () => {
    it('should add success toast with default duration', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success('Success message');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'success',
        message: 'Success message',
        duration: undefined, // Uses provider default
      });
      expect(result.current.toasts[0].id).toMatch(/^toast-/);
    });

    it('should add success toast with custom duration', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success('Success message', 2000);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'success',
        message: 'Success message',
        duration: 2000,
      });
    });

    it('should auto-remove success toast after duration', () => {
      const wrapper = createWrapper({ defaultDuration: 1000 });
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success('Success message');
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('Error Toast', () => {
    it('should add error toast with default duration', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.error('Error message');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'error',
        message: 'Error message',
      });
    });

    it('should add error toast with custom duration', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.error('Error message', 5000);
      });

      expect(result.current.toasts[0]).toMatchObject({
        type: 'error',
        message: 'Error message',
        duration: 5000,
      });
    });
  });

  describe('Warning Toast', () => {
    it('should add warning toast with default duration', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.warning('Warning message');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'warning',
        message: 'Warning message',
      });
    });

    it('should add warning toast with custom duration', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.warning('Warning message', 3000);
      });

      expect(result.current.toasts[0]).toMatchObject({
        type: 'warning',
        message: 'Warning message',
        duration: 3000,
      });
    });
  });

  describe('Info Toast', () => {
    it('should add info toast with default duration', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.info('Info message');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'info',
        message: 'Info message',
      });
    });

    it('should add info toast with custom duration', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.info('Info message', 6000);
      });

      expect(result.current.toasts[0]).toMatchObject({
        type: 'info',
        message: 'Info message',
        duration: 6000,
      });
    });
  });

  describe('Multiple Toasts', () => {
    it('should add multiple toasts of different types', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success('Success message');
        result.current.error('Error message');
        result.current.warning('Warning message');
        result.current.info('Info message');
      });

      expect(result.current.toasts).toHaveLength(4);

      // Check that each toast has the correct type (newest first)
      expect(result.current.toasts[0].type).toBe('info');
      expect(result.current.toasts[1].type).toBe('warning');
      expect(result.current.toasts[2].type).toBe('error');
      expect(result.current.toasts[3].type).toBe('success');
    });

    it('should respect maxToasts limit', () => {
      const wrapper = createWrapper({ maxToasts: 2 });
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success('First');
        result.current.error('Second');
        result.current.warning('Third');
      });

      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts[0].message).toBe('Third');
      expect(result.current.toasts[1].message).toBe('Second');
    });
  });

  describe('Manual Removal', () => {
    it('should remove toast by ID', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success('First toast');
        result.current.error('Second toast');
      });

      expect(result.current.toasts).toHaveLength(2);

      const firstToastId = result.current.toasts[1].id; // Success toast (older)

      act(() => {
        result.current.remove(firstToastId);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].message).toBe('Second toast');
    });

    it('should handle removing non-existent toast ID gracefully', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success('Test toast');
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.remove('non-existent-id');
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('should cancel auto-removal when manually removed', () => {
      const wrapper = createWrapper({ defaultDuration: 2000 });
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success('Test toast');
      });

      const toastId = result.current.toasts[0].id;

      // Manually remove before auto-removal
      act(() => {
        result.current.remove(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);

      // Advance time past auto-removal duration
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Should still be empty (no duplicate removal)
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('Custom Duration Handling', () => {
    it('should use provider default duration when not specified', () => {
      const wrapper = createWrapper({ defaultDuration: 1500 });
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success('Test message');
      });

      expect(result.current.toasts).toHaveLength(1);

      // Should not be removed before default duration
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.toasts).toHaveLength(1);

      // Should be removed after default duration
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current.toasts).toHaveLength(0);
    });

    it('should override provider default with custom duration', () => {
      const wrapper = createWrapper({ defaultDuration: 1000 });
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success('Test message', 3000);
      });

      // Should not be removed after provider default duration
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.toasts).toHaveLength(1);

      // Should be removed after custom duration
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('Stability and Memoization', () => {
    it('should maintain reference stability across re-renders', () => {
      const wrapper = createWrapper();
      const { result, rerender } = renderHook(() => useToast(), { wrapper });

      const initialMethods = {
        success: result.current.success,
        error: result.current.error,
        warning: result.current.warning,
        info: result.current.info,
        remove: result.current.remove,
      };

      rerender();

      expect(result.current.success).toBe(initialMethods.success);
      expect(result.current.error).toBe(initialMethods.error);
      expect(result.current.warning).toBe(initialMethods.warning);
      expect(result.current.info).toBe(initialMethods.info);
      expect(result.current.remove).toBe(initialMethods.remove);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty messages', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success('');
        result.current.error('');
      });

      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts[0].message).toBe('');
      expect(result.current.toasts[1].message).toBe('');
    });

    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(1000);
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success(longMessage);
      });

      expect(result.current.toasts[0].message).toBe(longMessage);
    });

    it('should handle zero and negative durations', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success('Zero duration', 0);
        result.current.error('Negative duration', -1000);
      });

      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts[0].duration).toBe(-1000);
      expect(result.current.toasts[1].duration).toBe(0);
    });
  });
});
