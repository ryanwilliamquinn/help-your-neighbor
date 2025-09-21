import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

// Simple development check
const isDevelopment = (): boolean => {
  try {
    return (
      typeof window !== 'undefined' && window.location.hostname === 'localhost'
    );
  } catch {
    return false;
  }
};

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * AsyncErrorBoundary - A specialized error boundary for async operations
 * This component catches errors that occur in async operations and provides
 * user-friendly error messages and recovery options.
 */
export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  private getErrorMessage(error: Error): string {
    // Provide user-friendly error messages based on error type
    if (error.message.includes('Network')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    if (error.message.includes('Invalid email')) {
      return 'Please enter a valid email address.';
    }

    if (error.message.includes('Password')) {
      return 'Password does not meet requirements.';
    }

    if (error.message.includes('User already exists')) {
      return 'An account with this email already exists.';
    }

    if (
      error.message.includes('User not found') ||
      error.message.includes('Invalid email or password')
    ) {
      return 'Invalid email or password. Please check your credentials.';
    }

    // Default message for unknown errors
    return 'An unexpected error occurred. Please try again.';
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const userMessage = this.getErrorMessage(this.state.error);

      return (
        <div className="async-error-boundary">
          <div className="error-content">
            <h3>Oops! Something went wrong</h3>
            <p>{userMessage}</p>

            <div className="error-actions">
              <button onClick={this.handleRetry} className="retry-button">
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="reload-button"
              >
                Reload Page
              </button>
            </div>

            {isDevelopment() && (
              <details className="error-details">
                <summary>Technical Details (Development Only)</summary>
                <pre>{this.state.error.stack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AsyncErrorBoundary;
