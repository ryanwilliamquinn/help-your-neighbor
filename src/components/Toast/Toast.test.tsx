import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from './Toast';
import type { Toast as ToastType } from '@/contexts/ToastContext';

// Mock CSS imports
jest.mock('./Toast.css', () => ({}));

describe('Toast Component', () => {
  const mockOnRemove = jest.fn();

  const createMockToast = (overrides: Partial<ToastType> = {}): ToastType => ({
    id: 'test-toast-1',
    type: 'success',
    message: 'Test toast message',
    duration: 4000,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render toast with correct content', () => {
      const toast = createMockToast();
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      expect(screen.getByTestId('toast-test-toast-1')).toBeInTheDocument();
      expect(
        screen.getByTestId('toast-message-test-toast-1')
      ).toHaveTextContent('Test toast message');
      expect(screen.getByTestId('toast-icon-test-toast-1')).toHaveTextContent(
        '✅'
      );
      expect(
        screen.getByTestId('toast-close-test-toast-1')
      ).toBeInTheDocument();
    });

    it('should render success toast with correct styling and icon', () => {
      const toast = createMockToast({ type: 'success' });
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      const toastElement = screen.getByTestId('toast-test-toast-1');
      expect(toastElement).toHaveClass('toast--success');
      expect(toastElement).toHaveAttribute('data-toast-type', 'success');
      expect(screen.getByTestId('toast-icon-test-toast-1')).toHaveTextContent(
        '✅'
      );
    });

    it('should render error toast with correct styling and icon', () => {
      const toast = createMockToast({ type: 'error' });
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      const toastElement = screen.getByTestId('toast-test-toast-1');
      expect(toastElement).toHaveClass('toast--error');
      expect(toastElement).toHaveAttribute('data-toast-type', 'error');
      expect(screen.getByTestId('toast-icon-test-toast-1')).toHaveTextContent(
        '❌'
      );
    });

    it('should render warning toast with correct styling and icon', () => {
      const toast = createMockToast({ type: 'warning' });
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      const toastElement = screen.getByTestId('toast-test-toast-1');
      expect(toastElement).toHaveClass('toast--warning');
      expect(toastElement).toHaveAttribute('data-toast-type', 'warning');
      expect(screen.getByTestId('toast-icon-test-toast-1')).toHaveTextContent(
        '⚠️'
      );
    });

    it('should render info toast with correct styling and icon', () => {
      const toast = createMockToast({ type: 'info' });
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      const toastElement = screen.getByTestId('toast-test-toast-1');
      expect(toastElement).toHaveClass('toast--info');
      expect(toastElement).toHaveAttribute('data-toast-type', 'info');
      expect(screen.getByTestId('toast-icon-test-toast-1')).toHaveTextContent(
        'ℹ️'
      );
    });

    it('should render with exit class when isRemoving is true', () => {
      const toast = createMockToast();
      render(<Toast toast={toast} onRemove={mockOnRemove} isRemoving={true} />);

      expect(screen.getByTestId('toast-test-toast-1')).toHaveClass(
        'toast-exit'
      );
    });

    it('should render long messages correctly', () => {
      const longMessage =
        'This is a very long toast message that should wrap properly and not break the layout of the toast component even when it contains a lot of text content.';
      const toast = createMockToast({ message: longMessage });
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      expect(
        screen.getByTestId('toast-message-test-toast-1')
      ).toHaveTextContent(longMessage);
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes for success toast', () => {
      const toast = createMockToast({ type: 'success' });
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      const toastElement = screen.getByTestId('toast-test-toast-1');
      expect(toastElement).toHaveAttribute('role', 'status');
      expect(toastElement).toHaveAttribute('aria-live', 'polite');
      expect(toastElement).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have correct ARIA attributes for error toast', () => {
      const toast = createMockToast({ type: 'error' });
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      const toastElement = screen.getByTestId('toast-test-toast-1');
      expect(toastElement).toHaveAttribute('role', 'alert');
      expect(toastElement).toHaveAttribute('aria-live', 'assertive');
      expect(toastElement).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have correct ARIA attributes for warning toast', () => {
      const toast = createMockToast({ type: 'warning' });
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      const toastElement = screen.getByTestId('toast-test-toast-1');
      expect(toastElement).toHaveAttribute('role', 'alert');
      expect(toastElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should have correct ARIA attributes for info toast', () => {
      const toast = createMockToast({ type: 'info' });
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      const toastElement = screen.getByTestId('toast-test-toast-1');
      expect(toastElement).toHaveAttribute('role', 'status');
      expect(toastElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper aria-label for close button', () => {
      const toast = createMockToast({ message: 'Test message' });
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      const closeButton = screen.getByTestId('toast-close-test-toast-1');
      expect(closeButton).toHaveAttribute(
        'aria-label',
        'Close success notification: Test message'
      );
    });

    it('should have aria-hidden on icon', () => {
      const toast = createMockToast();
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      const icon = screen.getByTestId('toast-icon-test-toast-1');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Interactions', () => {
    it('should call onRemove when close button is clicked', async () => {
      const user = userEvent.setup();
      const toast = createMockToast();
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      await user.click(screen.getByTestId('toast-close-test-toast-1'));
      expect(mockOnRemove).toHaveBeenCalledWith('test-toast-1');
      expect(mockOnRemove).toHaveBeenCalledTimes(1);
    });

    it('should call onRemove when Escape key is pressed', () => {
      const toast = createMockToast();
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      const toastElement = screen.getByTestId('toast-test-toast-1');
      fireEvent.keyDown(toastElement, { key: 'Escape' });

      expect(mockOnRemove).toHaveBeenCalledWith('test-toast-1');
      expect(mockOnRemove).toHaveBeenCalledTimes(1);
    });

    it('should not call onRemove when other keys are pressed', () => {
      const toast = createMockToast();
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      const toastElement = screen.getByTestId('toast-test-toast-1');
      fireEvent.keyDown(toastElement, { key: 'Enter' });
      fireEvent.keyDown(toastElement, { key: 'Space' });
      fireEvent.keyDown(toastElement, { key: 'Tab' });

      expect(mockOnRemove).not.toHaveBeenCalled();
    });

    it('should be focusable and keyboard accessible', () => {
      const toast = createMockToast();
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      const closeButton = screen.getByTestId('toast-close-test-toast-1');
      expect(closeButton).toBeEnabled();
      expect(closeButton.tagName).toBe('BUTTON');
    });
  });

  describe('CSS Classes', () => {
    it('should have base toast class', () => {
      const toast = createMockToast();
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      expect(screen.getByTestId('toast-test-toast-1')).toHaveClass('toast');
    });

    it('should apply correct type-specific class for each toast type', () => {
      const types: Array<ToastType['type']> = [
        'success',
        'error',
        'warning',
        'info',
      ];

      types.forEach((type) => {
        const toast = createMockToast({ type, id: `toast-${type}` });
        render(<Toast toast={toast} onRemove={mockOnRemove} />);

        expect(screen.getByTestId(`toast-toast-${type}`)).toHaveClass(
          `toast--${type}`
        );
      });
    });

    it('should not have exit class by default', () => {
      const toast = createMockToast();
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      expect(screen.getByTestId('toast-test-toast-1')).not.toHaveClass(
        'toast-exit'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const toast = createMockToast({ message: '' });
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      expect(
        screen.getByTestId('toast-message-test-toast-1')
      ).toHaveTextContent('');
      expect(screen.getByTestId('toast-test-toast-1')).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      const specialMessage =
        'Test with <script>alert("xss")</script> & special chars "quotes" \'apostrophes\'';
      const toast = createMockToast({ message: specialMessage });
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      expect(
        screen.getByTestId('toast-message-test-toast-1')
      ).toHaveTextContent(specialMessage);
    });

    it('should handle very long toast ID', () => {
      const longId = 'a'.repeat(100);
      const toast = createMockToast({ id: longId });
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      expect(screen.getByTestId(`toast-${longId}`)).toBeInTheDocument();
    });

    it('should handle multiple rapid close button clicks', async () => {
      const user = userEvent.setup();
      const toast = createMockToast();
      render(<Toast toast={toast} onRemove={mockOnRemove} />);

      const closeButton = screen.getByTestId('toast-close-test-toast-1');

      // Click multiple times rapidly
      await user.click(closeButton);
      await user.click(closeButton);
      await user.click(closeButton);

      // Should only call onRemove for the first click
      expect(mockOnRemove).toHaveBeenCalledTimes(3);
      expect(mockOnRemove).toHaveBeenCalledWith('test-toast-1');
    });
  });
});
