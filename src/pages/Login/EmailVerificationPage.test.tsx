import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import EmailVerificationPage from './EmailVerificationPage';
import { ToastProvider } from '@/contexts';

// Mock the services module
jest.mock('../../services', () => ({
  apiService: {
    resendConfirmationEmail: jest.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockLocation: { state: { email?: string; userEmail?: string } } = {
  state: { email: 'test@example.com' },
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock toast hook
const mockToast = {
  error: jest.fn(),
  success: jest.fn(),
};
jest.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

const renderEmailVerificationPage = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <EmailVerificationPage />
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('EmailVerificationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.state = { email: 'test@example.com' };
  });

  it('renders email verification page with email address', () => {
    renderEmailVerificationPage();

    expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(
      screen.getByText(/We've sent a confirmation link to/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /resend email/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /go to login/i })
    ).toBeInTheDocument();
  });

  it('renders with generic message when email is not provided', () => {
    mockLocation.state = {};
    renderEmailVerificationPage();

    expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    expect(screen.getByText('your email address')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /resend email/i })
    ).toBeDisabled();
  });

  it('successfully resends confirmation email', async () => {
    const user = userEvent.setup();
    const { apiService } = await import('../../services');

    (apiService.resendConfirmationEmail as jest.Mock).mockResolvedValue(
      undefined
    );

    renderEmailVerificationPage();

    const resendButton = screen.getByRole('button', { name: /resend email/i });
    await user.click(resendButton);

    await waitFor(() => {
      expect(apiService.resendConfirmationEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
    });

    // Verify no success toast is shown (success toasts have been removed)
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('shows error when resend fails', async () => {
    const user = userEvent.setup();
    const { apiService } = await import('../../services');

    const errorMessage = 'Failed to send email';
    (apiService.resendConfirmationEmail as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );

    renderEmailVerificationPage();

    const resendButton = screen.getByRole('button', { name: /resend email/i });
    await user.click(resendButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('disables resend button when no email is available', async () => {
    mockLocation.state = {};

    renderEmailVerificationPage();

    const resendButton = screen.getByRole('button', { name: /resend email/i });
    expect(resendButton).toBeDisabled();

    // Verify the button shows generic text when no email
    expect(screen.getByText('your email address')).toBeInTheDocument();

    // The button should remain disabled and not trigger any error messages
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('navigates to login page when Go to Login is clicked', async () => {
    const user = userEvent.setup();
    renderEmailVerificationPage();

    const loginButton = screen.getByRole('button', { name: /go to login/i });
    await user.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('disables resend button and shows loading state during resend', async () => {
    const user = userEvent.setup();
    const { apiService } = await import('../../services');

    // Mock a delayed response
    let resolveResend: () => void;
    const resendPromise = new Promise<void>((resolve) => {
      resolveResend = resolve;
    });
    (apiService.resendConfirmationEmail as jest.Mock).mockReturnValue(
      resendPromise
    );

    renderEmailVerificationPage();

    const resendButton = screen.getByRole('button', { name: /resend email/i });
    await user.click(resendButton);

    // Check loading state
    expect(screen.getByText('Sending...')).toBeInTheDocument();
    expect(resendButton).toBeDisabled();

    // Resolve the promise
    resolveResend!();

    await waitFor(() => {
      expect(screen.getByText('Resend Email')).toBeInTheDocument();
      expect(resendButton).not.toBeDisabled();
    });
  });

  it('handles location state with userEmail property', () => {
    mockLocation.state = { userEmail: 'user@example.com' };
    renderEmailVerificationPage();

    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('displays help instructions correctly', () => {
    renderEmailVerificationPage();

    expect(
      screen.getByText(/Already confirmed your email/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Still having trouble/)).toBeInTheDocument();
    expect(screen.getByText(/check your spam folder/)).toBeInTheDocument();
  });

  it('displays email icon and instructions', () => {
    renderEmailVerificationPage();

    expect(screen.getByText('📧')).toBeInTheDocument();
    expect(
      screen.getByText(/Click the link in the email to activate/)
    ).toBeInTheDocument();
  });
});
