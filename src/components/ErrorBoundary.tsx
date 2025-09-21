import { Component } from 'react';
import type { ReactNode } from 'react';

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
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(): void {
    // In production, you could log to an error reporting service here
    // For example: logErrorToService(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <p>We're sorry, but something unexpected happened.</p>
          {isDevelopment() && this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap' }}>
              <summary>Error details (development only)</summary>
              {this.state.error.toString()}
              <br />
              {this.state.error.stack}
            </details>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
