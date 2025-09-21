import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import { useAuth } from '@/hooks';

// Mock the useAuth hook
jest.mock('@/hooks', () => ({
  useAuth: jest.fn(),
}));

// Mock the API service
jest.mock('@/services', () => ({
  apiService: {
    getUserGroups: jest.fn().mockResolvedValue([]),
    getUserRequests: jest.fn().mockResolvedValue([]),
    getGroupRequests: jest.fn().mockResolvedValue([]),
    getUserById: jest.fn().mockResolvedValue({}),
  },
}));

// Cast the mock to the correct type
const useAuthMock = useAuth as jest.Mock;

describe('DashboardPage', () => {
  it('should render loading state when loading', () => {
    useAuthMock.mockReturnValue({
      loading: true,
      user: null,
    });

    render(<DashboardPage />);
    expect(screen.getByText(/loading dashboard.../i)).toBeInTheDocument();
  });

  it('should render error state when no user', () => {
    useAuthMock.mockReturnValue({
      loading: false,
      user: null,
    });

    render(<DashboardPage />);
    expect(
      screen.getByText(/please log in to view your dashboard/i)
    ).toBeInTheDocument();
  });

  it('should render dashboard with welcome message when authenticated', async () => {
    useAuthMock.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
    });

    render(<DashboardPage />);

    // Wait for the dashboard to finish loading
    await waitFor(() => {
      expect(screen.getByText(/welcome back, Test User/i)).toBeInTheDocument();
    });

    // Should show the main sections
    expect(
      screen.getByRole('heading', { name: /your requests/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /help your neighbors/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /your groups/i })
    ).toBeInTheDocument();

    // Should show empty states initially
    expect(
      screen.getByText(/you haven't posted any requests yet/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no requests from your group members right now/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/you're not part of any groups yet/i)
    ).toBeInTheDocument();
  });

  it('should render action buttons', async () => {
    useAuthMock.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
    });

    render(<DashboardPage />);

    // Wait for the dashboard to finish loading
    await waitFor(() => {
      expect(screen.getByText(/welcome back, Test User/i)).toBeInTheDocument();
    });

    // Should show action buttons
    expect(
      screen.getByRole('button', { name: /\+ new request/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create your first request/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /view all groups/i })
    ).toBeInTheDocument();
  });
});
