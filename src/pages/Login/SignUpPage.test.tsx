import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SignUpPage from './SignUpPage';
import { ToastProvider } from '@/contexts';
import type { AuthResponse } from '@/types';

// Mock the services module
jest.mock('../../services', () => ({
  apiService: {
    signUp: jest.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock toast hook
const mockToast = {
  error: jest.fn(),
  success: jest.fn(),
};

// Mock hooks
jest.mock('@/hooks', () => ({
  useAuth: () => ({
    signUp: jest.fn(),
  }),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

const renderSignUpPage = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <SignUpPage />
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('SignUpPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders signup form', () => {
    renderSignUpPage();

    expect(
      screen.getByRole('heading', { name: 'Sign Up' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign up/i })
    ).toBeInTheDocument();
  });

  it('shows error when submitting with empty fields', async () => {
    renderSignUpPage();

    const emailInput = screen.getByLabelText(/email/i);
    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Please fill in all fields');
    });
  });

  it('shows error when email is missing', async () => {
    const user = userEvent.setup();
    renderSignUpPage();

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    const form = passwordInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Please fill in all fields');
    });
  });

  it('shows error when password is missing', async () => {
    const user = userEvent.setup();
    renderSignUpPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(emailInput, 'test@example.com');
    // Ensure password field is empty by clearing any default value
    await user.clear(passwordInput);

    // Submit form directly to bypass HTML5 validation
    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Please fill in all fields');
    });
  });

  it('navigates to verification page when email confirmation is required', async () => {
    const user = userEvent.setup();
    const { apiService } = await import('../../services');

    // Mock API response for email confirmation required
    const mockResponse: AuthResponse = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: '',
        phone: '',
        generalArea: '',
        createdAt: new Date(),
      },
      session: null,
      emailConfirmationRequired: true,
    };

    (apiService.signUp as jest.Mock).mockResolvedValue(mockResponse);

    renderSignUpPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/verify-email', {
        state: { email: 'test@example.com' },
      });
    });

    expect(apiService.signUp).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    );
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('navigates to home when signup is successful without email confirmation', async () => {
    const user = userEvent.setup();
    const { apiService } = await import('../../services');

    // Mock API response for successful signup without email confirmation
    const mockResponse: AuthResponse = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: '',
        phone: '',
        generalArea: '',
        createdAt: new Date(),
      },
      session: 'valid-session-token',
      emailConfirmationRequired: false,
    };

    (apiService.signUp as jest.Mock).mockResolvedValue(mockResponse);

    renderSignUpPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    // Verify no success toast is shown (success toasts have been removed)
    expect(mockToast.success).not.toHaveBeenCalled();

    expect(apiService.signUp).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    );
  });

  it('navigates to verification page when session is null (legacy behavior)', async () => {
    const user = userEvent.setup();
    const { apiService } = await import('../../services');

    // Mock API response with null session (legacy behavior)
    const mockResponse: AuthResponse = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: '',
        phone: '',
        generalArea: '',
        createdAt: new Date(),
      },
      session: null,
    };

    (apiService.signUp as jest.Mock).mockResolvedValue(mockResponse);

    renderSignUpPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/verify-email', {
        state: { email: 'test@example.com' },
      });
    });
  });

  it('shows error message when signup fails', async () => {
    const user = userEvent.setup();
    const { apiService } = await import('../../services');

    const errorMessage = 'Email already exists';
    (apiService.signUp as jest.Mock).mockRejectedValue(new Error(errorMessage));

    renderSignUpPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('disables form and shows loading state during signup', async () => {
    const user = userEvent.setup();
    const { apiService } = await import('../../services');

    // Mock a delayed response
    let resolveSignUp: (value: AuthResponse) => void;
    const signUpPromise = new Promise<AuthResponse>((resolve) => {
      resolveSignUp = resolve;
    });
    (apiService.signUp as jest.Mock).mockReturnValue(signUpPromise);

    renderSignUpPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    // Check loading state
    expect(screen.getByText('Signing up...')).toBeInTheDocument();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolveSignUp!({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: '',
        phone: '',
        generalArea: '',
        createdAt: new Date(),
      },
      session: 'valid-session-token',
    });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sign Up' })
      ).toBeInTheDocument();
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderSignUpPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'differentpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Passwords do not match');
    });
  });

  it('shows error when confirm password is missing', async () => {
    const user = userEvent.setup();
    renderSignUpPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    // Leave confirm password empty
    await user.clear(confirmPasswordInput);

    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Please fill in all fields');
    });
  });
});
