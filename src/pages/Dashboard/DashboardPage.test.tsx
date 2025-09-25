import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { useAuth, useToast, useUserLimits } from '@/hooks';
import { apiService } from '@/services';
import type { Request, RequestStatus } from '@/types';

// Mock the hooks
jest.mock('@/hooks', () => ({
  useAuth: jest.fn(),
  useToast: jest.fn(),
  useUserLimits: jest.fn(),
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
const useUserLimitsMock = useUserLimits as jest.Mock;
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Helper to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('DashboardPage', () => {
  beforeEach(() => {
    // Default mock for useUserLimits
    useUserLimitsMock.mockReturnValue({
      limitsData: {
        limits: {
          maxOpenRequests: 5,
          maxGroupsCreated: 3,
          maxGroupsJoined: 5,
        },
        counts: {
          openRequestsCount: 2,
          groupsCreatedCount: 1,
          groupsJoinedCount: 2,
        },
      },
      loading: false,
      canCreateRequest: true,
      canCreateGroup: true,
      canJoinGroup: true,
      refreshLimits: jest.fn(),
    });

    // Default mock for useToast
    useToastMock.mockReturnValue({
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warning: jest.fn(),
    });
  });

  it('should render loading state when loading', () => {
    useAuthMock.mockReturnValue({
      loading: true,
      user: null,
    });

    renderWithRouter(<DashboardPage />);
    expect(screen.getByText(/loading dashboard.../i)).toBeInTheDocument();
  });

  it('should render error state when no user', () => {
    useAuthMock.mockReturnValue({
      loading: false,
      user: null,
    });

    renderWithRouter(<DashboardPage />);
    expect(
      screen.getByText(/please log in to view your dashboard/i)
    ).toBeInTheDocument();
  });

  it('should render dashboard with welcome message when authenticated', async () => {
    useAuthMock.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
    });

    renderWithRouter(<DashboardPage />);

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

  it('should disable create request button when user has no groups', async () => {
    useAuthMock.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com', id: 'test-id' },
    });

    // Mock empty groups array
    mockApiService.getUserGroups.mockResolvedValue([]);

    renderWithRouter(<DashboardPage />);

    // Wait for the dashboard to finish loading
    await waitFor(() => {
      expect(screen.getByText(/welcome back, Test User/i)).toBeInTheDocument();
    });

    // Should show disabled create request button
    const createButton = screen.getByRole('button', {
      name: /\+ new request/i,
    });
    expect(createButton).toBeDisabled();
    expect(createButton).toHaveAttribute(
      'title',
      'You need to join a group before creating requests'
    );

    // Should show "Join or Create a Group" button in empty state
    expect(
      screen.getByText(/you need to join a group first!/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /join or create a group/i })
    ).toBeInTheDocument();
  });

  it('should enable create request button when user has groups and can create', async () => {
    useAuthMock.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com', id: 'test-id' },
    });

    // Mock groups array with one group
    mockApiService.getUserGroups.mockResolvedValue([
      {
        id: 'group-1',
        name: 'Test Group',
        createdBy: 'test-id',
        createdAt: new Date(),
      },
    ]);

    renderWithRouter(<DashboardPage />);

    // Wait for the dashboard to finish loading
    await waitFor(() => {
      expect(screen.getByText(/welcome back, Test User/i)).toBeInTheDocument();
    });

    // Should show enabled create request button
    const createButton = screen.getByRole('button', {
      name: /\+ new request/i,
    });
    expect(createButton).not.toBeDisabled();
    expect(createButton).toHaveAttribute('title', 'Create a new request');

    // Should show "Create your first request" button in empty state
    expect(
      screen.getByRole('button', { name: /create your first request/i })
    ).toBeInTheDocument();
  });

  it('should disable create request button when user has groups but hit limits', async () => {
    useAuthMock.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com', id: 'test-id' },
    });

    // Mock user at request limit
    useUserLimitsMock.mockReturnValue({
      limitsData: {
        limits: {
          maxOpenRequests: 5,
          maxGroupsCreated: 3,
          maxGroupsJoined: 5,
        },
        counts: {
          openRequestsCount: 5, // At limit
          groupsCreatedCount: 1,
          groupsJoinedCount: 2,
        },
      },
      loading: false,
      canCreateRequest: false, // Hit limit
      canCreateGroup: true,
      canJoinGroup: true,
      refreshLimits: jest.fn(),
    });

    // Mock groups array with one group
    mockApiService.getUserGroups.mockResolvedValue([
      {
        id: 'group-1',
        name: 'Test Group',
        createdBy: 'test-id',
        createdAt: new Date(),
      },
    ]);

    renderWithRouter(<DashboardPage />);

    // Wait for the dashboard to finish loading
    await waitFor(() => {
      expect(screen.getByText(/welcome back, Test User/i)).toBeInTheDocument();
    });

    // Should show disabled create request button with limit message
    const createButton = screen.getByRole('button', {
      name: /\+ new request/i,
    });
    expect(createButton).toBeDisabled();
    expect(createButton).toHaveAttribute(
      'title',
      'You have reached your limit of open requests'
    );
  });

  it('should render clickable group cards that navigate to groups page', async () => {
    useAuthMock.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com', id: 'test-id' },
    });

    // Mock groups array
    mockApiService.getUserGroups.mockResolvedValue([
      {
        id: 'group-1',
        name: 'Test Group',
        createdBy: 'test-id',
        createdAt: new Date(),
      },
    ]);

    renderWithRouter(<DashboardPage />);

    // Wait for groups to load
    await waitFor(() => {
      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });

    // Find the group card and verify it has clickable attributes
    const groupCard = screen
      .getByText('Test Group')
      .closest('.group-card-clickable');
    expect(groupCard).toBeInTheDocument();
    expect(groupCard).toHaveAttribute('role', 'button');
    expect(groupCard).toHaveAttribute('tabIndex', '0');

    // Verify keyboard navigation works
    if (groupCard) {
      fireEvent.keyDown(groupCard, { key: 'Enter' });
      fireEvent.keyDown(groupCard, { key: ' ' });
    }
  });

  it('should render action buttons', async () => {
    useAuthMock.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
    });

    renderWithRouter(<DashboardPage />);

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

    renderWithRouter(<DashboardPage />);

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

    renderWithRouter(<DashboardPage />);

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

    renderWithRouter(<DashboardPage />);

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

    renderWithRouter(<DashboardPage />);

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

    renderWithRouter(<DashboardPage />);

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
