import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToastContext } from './ToastContext';

// Test component that uses the toast context
const TestComponent: React.FC = () => {
  const { toasts, addToast, removeToast } = useToastContext();

  return (
    <div>
      <div data-testid="toast-count">{toasts.length}</div>
      {toasts.map((toast) => (
        <div key={toast.id} data-testid={`toast-${toast.id}`}>
          <span data-testid={`toast-type-${toast.id}`}>{toast.type}</span>
          <span data-testid={`toast-message-${toast.id}`}>{toast.message}</span>
          <button
            data-testid={`toast-remove-${toast.id}`}
            onClick={() => removeToast(toast.id)}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        data-testid="add-success-toast"
        onClick={() =>
          addToast({ type: 'success', message: 'Success message' })
        }
      >
        Add Success Toast
      </button>
      <button
        data-testid="add-error-toast"
        onClick={() => addToast({ type: 'error', message: 'Error message' })}
      >
        Add Error Toast
      </button>
      <button
        data-testid="add-warning-toast"
        onClick={() =>
          addToast({ type: 'warning', message: 'Warning message' })
        }
      >
        Add Warning Toast
      </button>
      <button
        data-testid="add-info-toast"
        onClick={() => addToast({ type: 'info', message: 'Info message' })}
      >
        Add Info Toast
      </button>
      <button
        data-testid="add-custom-duration-toast"
        onClick={() =>
          addToast({
            type: 'info',
            message: 'Custom duration',
            duration: 1000,
          })
        }
      >
        Add Custom Duration Toast
      </button>
    </div>
  );
};

// Component to test hook outside provider
const TestComponentOutsideProvider: React.FC = () => {
  let error: string | null = null;

  try {
    useToastContext();
  } catch (err) {
    error = (err as Error).message;
  }

  if (error) {
    return <div data-testid="error-message">{error}</div>;
  }

  return <div>Should not reach here</div>;
};

describe('ToastContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('useToastContext hook', () => {
    it('should throw error when used outside provider', () => {
      render(<TestComponentOutsideProvider />);
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'useToastContext must be used within a ToastProvider'
      );
    });
  });

  describe('ToastProvider', () => {
    it('should render children correctly', () => {
      render(
        <ToastProvider>
          <div data-testid="test-child">Test Content</div>
        </ToastProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toHaveTextContent(
        'Test Content'
      );
    });

    it('should start with empty toasts array', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });

    it('should add success toast correctly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('add-success-toast'));

      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      // Check that toast elements exist
      const toastElements = screen.getAllByTestId(/^toast-toast-/);
      expect(toastElements).toHaveLength(1);

      const toastId = toastElements[0]
        .getAttribute('data-testid')
        ?.replace('toast-', '');
      expect(screen.getByTestId(`toast-type-${toastId}`)).toHaveTextContent(
        'success'
      );
      expect(screen.getByTestId(`toast-message-${toastId}`)).toHaveTextContent(
        'Success message'
      );
    });

    it('should add multiple toast types correctly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('add-success-toast'));
      await user.click(screen.getByTestId('add-error-toast'));
      await user.click(screen.getByTestId('add-warning-toast'));
      await user.click(screen.getByTestId('add-info-toast'));

      expect(screen.getByTestId('toast-count')).toHaveTextContent('4');

      // Check all toast types are present
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('should remove toast manually', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('add-success-toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      const toastElements = screen.getAllByTestId(/^toast-toast-/);
      const toastId = toastElements[0]
        .getAttribute('data-testid')
        ?.replace('toast-', '');

      await user.click(screen.getByTestId(`toast-remove-${toastId}`));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });

    it('should auto-remove toast after default duration', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('add-success-toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      // Fast-forward time by default duration (4000ms)
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });

    it('should auto-remove toast after custom duration', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('add-custom-duration-toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      // Fast-forward time by custom duration (1000ms)
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });

    it('should respect maxToasts limit', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <ToastProvider maxToasts={2}>
          <TestComponent />
        </ToastProvider>
      );

      // Add 3 toasts, but should only keep 2
      await user.click(screen.getByTestId('add-success-toast'));
      await user.click(screen.getByTestId('add-error-toast'));
      await user.click(screen.getByTestId('add-warning-toast'));

      expect(screen.getByTestId('toast-count')).toHaveTextContent('2');

      // Should have the 2 most recent toasts (error and warning)
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });

    it('should use custom default duration', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <ToastProvider defaultDuration={2000}>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('add-success-toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      // Fast-forward time by custom default duration (2000ms)
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });

    it('should clear timeout when manually removing toast', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('add-success-toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      const toastElements = screen.getAllByTestId(/^toast-toast-/);
      const toastId = toastElements[0]
        .getAttribute('data-testid')
        ?.replace('toast-', '');

      // Manually remove toast
      await user.click(screen.getByTestId(`toast-remove-${toastId}`));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');

      // Fast-forward time to ensure timeout was cleared
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      // Should still be 0 (no duplicate removal)
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });

    it('should generate unique IDs for toasts', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('add-success-toast'));
      await user.click(screen.getByTestId('add-success-toast'));

      const toastElements = screen.getAllByTestId(/^toast-toast-/);
      expect(toastElements).toHaveLength(2);

      const toast1Id = toastElements[0]
        .getAttribute('data-testid')
        ?.replace('toast-', '');
      const toast2Id = toastElements[1]
        .getAttribute('data-testid')
        ?.replace('toast-', '');

      expect(toast1Id).not.toBe(toast2Id);
      expect(toast1Id).toMatch(/^toast-\d+-[a-z0-9]+$/);
      expect(toast2Id).toMatch(/^toast-\d+-[a-z0-9]+$/);
    });

    it('should add new toasts at the beginning of the array', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('add-success-toast'));
      await user.click(screen.getByTestId('add-error-toast'));

      const toastElements = screen.getAllByTestId(/^toast-toast-/);
      expect(toastElements).toHaveLength(2);

      // First element should be the most recent (error toast)
      const firstToastId = toastElements[0]
        .getAttribute('data-testid')
        ?.replace('toast-', '');
      expect(
        screen.getByTestId(`toast-message-${firstToastId}`)
      ).toHaveTextContent('Error message');

      // Second element should be the older (success toast)
      const secondToastId = toastElements[1]
        .getAttribute('data-testid')
        ?.replace('toast-', '');
      expect(
        screen.getByTestId(`toast-message-${secondToastId}`)
      ).toHaveTextContent('Success message');
    });
  });
});
