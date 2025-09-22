import { render, screen } from '@testing-library/react';
import App from './App';
import { useAuth } from '@/hooks';

// Mock the useAuth hook
jest.mock('@/hooks', () => ({
  useAuth: jest.fn(),
}));

// Cast the mock to the correct type
const useAuthMock = useAuth as jest.Mock;

describe('App', () => {
  it('should render the loading indicator when loading', () => {
    useAuthMock.mockReturnValue({
      loading: true,
      user: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateUserProfile: jest.fn(),
    });

    render(<App />);
    expect(screen.getByText(/loading.../i)).toBeInTheDocument();
  });

  it('should render the LoginPage when not authenticated', () => {
    useAuthMock.mockReturnValue({
      loading: false,
      user: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateUserProfile: jest.fn(),
    });

    render(<App />);
    expect(
      screen.getByRole('heading', { name: /login/i, level: 1 })
    ).toBeInTheDocument();
  });

  it('should render authenticated navigation when authenticated', () => {
    useAuthMock.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateUserProfile: jest.fn(),
    });

    render(<App />);

    // The navigation should show the logout button when authenticated
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();

    // The navigation should show Profile link
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();

    // The navigation should show brand link
    expect(
      screen.getByRole('link', { name: /help your neighbor/i })
    ).toBeInTheDocument();
  });
});
