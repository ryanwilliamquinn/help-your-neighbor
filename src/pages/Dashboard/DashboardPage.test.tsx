import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import { useAuth, useToast } from '@/hooks';
import { apiService } from '@/services';
import type { Request, RequestStatus } from '@/types';

// Mock the hooks
jest.mock('@/hooks', () => ({
  useAuth: jest.fn(),
  useToast: jest.fn(),
}));

// Mock the API service
jest.mock('@/services', () => ({
  apiService: {
    getUserGroups: jest.fn().mockResolvedValue([]),
    getUserRequests: jest.fn().mockResolvedValue([]),
    getGroupRequests: jest.fn().mockResolvedValue([]),
    getUserById: jest.fn().mockResolvedValue({}),
    getUsersByIds: jest.fn().mockResolvedValue([]),
  },
}));

// Cast the mocks to the correct types
const useAuthMock = useAuth as jest.Mock;
const useToastMock = useToast as jest.Mock;
const mockApiService = apiService as jest.Mocked<typeof apiService>;

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

  it('should batch load user data and attach to requests', async () => {
    const mockUser = {
      id: 'current-user',
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-0001',
      generalArea: 'Downtown',
      createdAt: new Date(),
    };
    const mockGroups = [
      {
        id: 'group-1',
        name: 'Test Group',
        createdBy: 'current-user',
        createdAt: new Date(),
      },
    ];
    const mockUserRequests: Request[] = [
      {
        id: 'request-1',
        userId: 'current-user',
        groupId: 'group-1',
        itemDescription: 'Test item 1',
        status: 'claimed' as RequestStatus,
        claimedBy: 'helper-user-1',
        createdAt: new Date(),
        neededBy: new Date(),
      },
    ];
    const mockGroupRequests: Request[] = [
      {
        id: 'request-2',
        userId: 'other-user-1',
        groupId: 'group-1',
        itemDescription: 'Test item 2',
        status: 'open' as RequestStatus,
        createdAt: new Date(),
        neededBy: new Date(),
      },
      {
        id: 'request-3',
        userId: 'other-user-2',
        groupId: 'group-1',
        itemDescription: 'Test item 3',
        status: 'fulfilled' as RequestStatus,
        claimedBy: 'helper-user-2',
        createdAt: new Date(),
        neededBy: new Date(),
      },
    ];
    const mockUsers = [
      {
        id: 'current-user',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0001',
        generalArea: 'Downtown',
        createdAt: new Date(),
      },
      {
        id: 'other-user-1',
        name: 'Other User 1',
        email: 'other1@example.com',
        phone: '555-0002',
        generalArea: 'Midtown',
        createdAt: new Date(),
      },
      {
        id: 'other-user-2',
        name: 'Other User 2',
        email: 'other2@example.com',
        phone: '555-0003',
        generalArea: 'Uptown',
        createdAt: new Date(),
      },
      {
        id: 'helper-user-1',
        name: 'Helper User 1',
        email: 'helper1@example.com',
        phone: '555-0004',
        generalArea: 'Downtown',
        createdAt: new Date(),
      },
      {
        id: 'helper-user-2',
        name: 'Helper User 2',
        email: 'helper2@example.com',
        phone: '555-0005',
        generalArea: 'Midtown',
        createdAt: new Date(),
      },
    ];

    useAuthMock.mockReturnValue({
      loading: false,
      user: mockUser,
    });

    // Set up API mocks
    mockApiService.getUserGroups.mockResolvedValue(mockGroups);
    mockApiService.getUserRequests.mockResolvedValue(mockUserRequests);
    mockApiService.getGroupRequests.mockResolvedValue(mockGroupRequests);
    mockApiService.getUsersByIds.mockResolvedValue(mockUsers);

    render(<DashboardPage />);

    // Wait for the dashboard to finish loading
    await waitFor(() => {
      expect(screen.getByText(/welcome back, Test User/i)).toBeInTheDocument();
    });

    // Verify that getUsersByIds was called with all unique user IDs
    expect(mockApiService.getUsersByIds).toHaveBeenCalledWith([
      'current-user', // creator of request-1
      'other-user-1', // creator of request-2
      'other-user-2', // creator of request-3
      'helper-user-1', // helper for request-1
      'helper-user-2', // helper for request-3
    ]);

    // Verify that getUserById is NOT called (replaced by batch loading)
    expect(mockApiService.getUserById).not.toHaveBeenCalled();
  });

  it('should handle duplicate user IDs in batch loading efficiently', async () => {
    const mockUser = {
      id: 'current-user',
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-0001',
      generalArea: 'Downtown',
      createdAt: new Date(),
    };
    const mockGroups = [
      {
        id: 'group-1',
        name: 'Test Group',
        createdBy: 'current-user',
        createdAt: new Date(),
      },
    ];
    // Multiple requests from same users
    const mockUserRequests: Request[] = [
      {
        id: 'request-1',
        userId: 'current-user',
        groupId: 'group-1',
        itemDescription: 'Test item 1',
        status: 'claimed' as RequestStatus,
        claimedBy: 'helper-user-1',
        createdAt: new Date(),
        neededBy: new Date(),
      },
      {
        id: 'request-2',
        userId: 'current-user', // Same creator
        groupId: 'group-1',
        itemDescription: 'Test item 2',
        status: 'fulfilled' as RequestStatus,
        claimedBy: 'helper-user-1', // Same helper
        createdAt: new Date(),
        neededBy: new Date(),
      },
    ];
    const mockGroupRequests: Request[] = [
      {
        id: 'request-3',
        userId: 'other-user-1',
        groupId: 'group-1',
        itemDescription: 'Test item 3',
        status: 'claimed' as RequestStatus,
        claimedBy: 'helper-user-1', // Same helper again
        createdAt: new Date(),
        neededBy: new Date(),
      },
    ];
    const mockUsers = [
      {
        id: 'current-user',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0001',
        generalArea: 'Downtown',
        createdAt: new Date(),
      },
      {
        id: 'other-user-1',
        name: 'Other User 1',
        email: 'other1@example.com',
        phone: '555-0002',
        generalArea: 'Midtown',
        createdAt: new Date(),
      },
      {
        id: 'helper-user-1',
        name: 'Helper User 1',
        email: 'helper1@example.com',
        phone: '555-0004',
        generalArea: 'Downtown',
        createdAt: new Date(),
      },
    ];

    useAuthMock.mockReturnValue({
      loading: false,
      user: mockUser,
    });

    mockApiService.getUserGroups.mockResolvedValue(mockGroups);
    mockApiService.getUserRequests.mockResolvedValue(mockUserRequests);
    mockApiService.getGroupRequests.mockResolvedValue(mockGroupRequests);
    mockApiService.getUsersByIds.mockResolvedValue(mockUsers);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/welcome back, Test User/i)).toBeInTheDocument();
    });

    // Should deduplicate user IDs and call getUsersByIds only once
    expect(mockApiService.getUsersByIds).toHaveBeenCalledTimes(1);
    expect(mockApiService.getUsersByIds).toHaveBeenCalledWith([
      'current-user',
      'other-user-1',
      'helper-user-1',
    ]);
  });

  it('should handle empty requests gracefully', async () => {
    const mockUser = {
      id: 'current-user',
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-0001',
      generalArea: 'Downtown',
      createdAt: new Date(),
    };

    useAuthMock.mockReturnValue({
      loading: false,
      user: mockUser,
    });

    // Empty requests scenario
    mockApiService.getUserGroups.mockResolvedValue([]);
    mockApiService.getUserRequests.mockResolvedValue([]);
    mockApiService.getGroupRequests.mockResolvedValue([]);
    mockApiService.getUsersByIds.mockResolvedValue([]);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/welcome back, Test User/i)).toBeInTheDocument();
    });

    // Should still call getUsersByIds but with empty array
    expect(mockApiService.getUsersByIds).toHaveBeenCalledWith([]);
  });

  it('should handle requests without claimed users', async () => {
    const mockUser = {
      id: 'current-user',
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-0001',
      generalArea: 'Downtown',
      createdAt: new Date(),
    };
    const mockGroups = [
      {
        id: 'group-1',
        name: 'Test Group',
        createdBy: 'current-user',
        createdAt: new Date(),
      },
    ];
    const mockUserRequests: Request[] = [
      {
        id: 'request-1',
        userId: 'current-user',
        groupId: 'group-1',
        itemDescription: 'Open request',
        status: 'open' as RequestStatus,
        // No claimedBy
        createdAt: new Date(),
        neededBy: new Date(),
      },
    ];
    const mockGroupRequests: Request[] = [
      {
        id: 'request-2',
        userId: 'other-user-1',
        groupId: 'group-1',
        itemDescription: 'Another open request',
        status: 'open' as RequestStatus,
        // No claimedBy
        createdAt: new Date(),
        neededBy: new Date(),
      },
    ];
    const mockUsers = [
      {
        id: 'current-user',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0001',
        generalArea: 'Downtown',
        createdAt: new Date(),
      },
      {
        id: 'other-user-1',
        name: 'Other User 1',
        email: 'other1@example.com',
        phone: '555-0002',
        generalArea: 'Midtown',
        createdAt: new Date(),
      },
    ];

    useAuthMock.mockReturnValue({
      loading: false,
      user: mockUser,
    });

    mockApiService.getUserGroups.mockResolvedValue(mockGroups);
    mockApiService.getUserRequests.mockResolvedValue(mockUserRequests);
    mockApiService.getGroupRequests.mockResolvedValue(mockGroupRequests);
    mockApiService.getUsersByIds.mockResolvedValue(mockUsers);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/welcome back, Test User/i)).toBeInTheDocument();
    });

    // Should only call with creator IDs (no helpers)
    expect(mockApiService.getUsersByIds).toHaveBeenCalledWith([
      'current-user',
      'other-user-1',
    ]);
  });

  it('should handle API errors in batch user loading gracefully', async () => {
    const mockUser = {
      id: 'current-user',
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-0001',
      generalArea: 'Downtown',
      createdAt: new Date(),
    };
    const mockGroups = [
      {
        id: 'group-1',
        name: 'Test Group',
        createdBy: 'current-user',
        createdAt: new Date(),
      },
    ];
    const mockUserRequests: Request[] = [
      {
        id: 'request-1',
        userId: 'current-user',
        groupId: 'group-1',
        itemDescription: 'Test item',
        status: 'open' as RequestStatus,
        createdAt: new Date(),
        neededBy: new Date(),
      },
    ];

    useAuthMock.mockReturnValue({
      loading: false,
      user: mockUser,
    });

    mockApiService.getUserGroups.mockResolvedValue(mockGroups);
    mockApiService.getUserRequests.mockResolvedValue(mockUserRequests);
    mockApiService.getGroupRequests.mockResolvedValue([]);
    mockApiService.getUsersByIds.mockRejectedValue(new Error('Network error'));

    // Suppress console.error for this test since we expect an error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<DashboardPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText(/loading dashboard.../i)
      ).not.toBeInTheDocument();
    });

    // Verify that getUsersByIds was called and failed as expected
    expect(mockApiService.getUsersByIds).toHaveBeenCalledWith(['current-user']);

    // The loading should still complete (setLoadingData(false) is in finally block)
    // But the user data won't be attached due to the error
    expect(screen.getByText(/welcome back, Test User/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /your requests/i })
    ).toBeInTheDocument();

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock useToast for all tests
    useToastMock.mockReturnValue({
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
      remove: jest.fn(),
      toasts: [],
    });
  });
});
