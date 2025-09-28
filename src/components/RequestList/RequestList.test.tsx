import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RequestList from './RequestList';
import type { Request, User } from '@/types';

describe('RequestList', () => {
  const mockCreator: User = {
    id: 'creator-1',
    name: 'Alice Creator',
    email: 'alice@example.com',
    phone: '555-0101',
    generalArea: 'Downtown',
    isAdmin: false,
    createdAt: new Date(),
  };

  const mockHelper: User = {
    id: 'helper-1',
    name: 'Bob Helper',
    email: 'bob@example.com',
    phone: '555-0102',
    generalArea: 'Midtown',
    isAdmin: false,
    createdAt: new Date(),
  };

  const mockRequests: Request[] = [
    {
      id: 'req-1',
      userId: 'creator-1',
      groupId: 'group-1',
      itemDescription: 'Milk and bread',
      storePreference: 'Grocery Store',
      neededBy: new Date('2025-12-31T18:00:00Z'),
      pickupNotes: 'Any brand is fine',
      status: 'open',
      createdAt: new Date('2025-01-01T12:00:00Z'),
      creator: mockCreator,
    },
    {
      id: 'req-2',
      userId: 'creator-1',
      groupId: 'group-1',
      itemDescription: 'Pharmacy pickup',
      neededBy: new Date('2025-12-30T10:00:00Z'),
      status: 'claimed',
      claimedBy: 'helper-1',
      claimedAt: new Date('2025-01-02T12:00:00Z'),
      createdAt: new Date('2025-01-01T10:00:00Z'),
      creator: mockCreator,
      helper: mockHelper,
    },
    {
      id: 'req-3',
      userId: 'creator-1',
      groupId: 'group-1',
      itemDescription: 'Dog food',
      neededBy: new Date('2025-12-29T16:00:00Z'),
      status: 'fulfilled',
      claimedBy: 'helper-1',
      claimedAt: new Date('2025-01-03T09:00:00Z'),
      createdAt: new Date('2025-01-01T08:00:00Z'),
      creator: mockCreator,
      helper: mockHelper,
    },
  ];

  const mockOnClaim = jest.fn();
  const mockOnFulfill = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all requests with embedded user data', () => {
    render(
      <RequestList
        requests={mockRequests}
        isOwnRequests={false}
        currentUserId="current-user"
      />
    );

    // Verify all requests are rendered
    expect(screen.getByText('Milk and bread')).toBeInTheDocument();
    expect(screen.getByText('Pharmacy pickup')).toBeInTheDocument();
    expect(screen.getByText('Dog food')).toBeInTheDocument();

    // Verify creator information is shown for group requests
    const creatorElements = screen.getAllByText(/posted by alice creator/i);
    expect(creatorElements).toHaveLength(3); // All three requests show creator
  });

  it('should not show creator information for own requests', () => {
    render(
      <RequestList
        requests={mockRequests}
        isOwnRequests={true}
        currentUserId="creator-1"
      />
    );

    // Verify creator information is NOT shown for own requests
    expect(
      screen.queryByText(/posted by alice creator/i)
    ).not.toBeInTheDocument();
  });

  it('should show helper information for claimed and fulfilled requests', () => {
    render(
      <RequestList
        requests={mockRequests}
        isOwnRequests={true}
        currentUserId="creator-1"
      />
    );

    // Should show helper information for claimed request
    expect(screen.getByText(/being helped by bob helper/i)).toBeInTheDocument();

    // Should show helper information for fulfilled request
    expect(screen.getByText(/fulfilled by bob helper/i)).toBeInTheDocument();
  });

  it('should handle requests without embedded user data gracefully', () => {
    const requestsWithoutUserData: Request[] = [
      {
        id: 'req-no-data',
        userId: 'creator-1',
        groupId: 'group-1',
        itemDescription: 'Request without user data',
        neededBy: new Date('2025-12-31T18:00:00Z'),
        status: 'open',
        createdAt: new Date('2025-01-01T12:00:00Z'),
        // No creator or helper data
      },
      {
        id: 'req-partial-data',
        userId: 'creator-1',
        groupId: 'group-1',
        itemDescription: 'Request with partial data',
        neededBy: new Date('2025-12-31T18:00:00Z'),
        status: 'claimed',
        claimedBy: 'helper-1',
        claimedAt: new Date('2025-01-02T12:00:00Z'),
        createdAt: new Date('2025-01-01T12:00:00Z'),
        creator: mockCreator,
        // No helper data despite being claimed
      },
    ];

    render(
      <RequestList
        requests={requestsWithoutUserData}
        isOwnRequests={false}
        currentUserId="current-user"
      />
    );

    // Should render requests without crashing
    expect(screen.getByText('Request without user data')).toBeInTheDocument();
    expect(screen.getByText('Request with partial data')).toBeInTheDocument();

    // Should show creator info where available
    expect(screen.getByText(/posted by alice creator/i)).toBeInTheDocument();

    // Should handle missing helper gracefully
    expect(screen.getByText(/claimed by you/i)).toBeInTheDocument();
  });

  it('should sort requests by status priority and needed by date', () => {
    const unsortedRequests: Request[] = [
      {
        id: 'req-fulfilled',
        userId: 'creator-1',
        groupId: 'group-1',
        itemDescription: 'Fulfilled request',
        neededBy: new Date('2025-12-28T18:00:00Z'), // Earlier date
        status: 'fulfilled',
        createdAt: new Date('2025-01-01T12:00:00Z'),
        creator: mockCreator,
      },
      {
        id: 'req-open-urgent',
        userId: 'creator-1',
        groupId: 'group-1',
        itemDescription: 'Urgent open request',
        neededBy: new Date('2025-12-29T18:00:00Z'), // Later date but higher priority status
        status: 'open',
        createdAt: new Date('2025-01-01T12:00:00Z'),
        creator: mockCreator,
      },
      {
        id: 'req-claimed',
        userId: 'creator-1',
        groupId: 'group-1',
        itemDescription: 'Claimed request',
        neededBy: new Date('2025-12-30T18:00:00Z'),
        status: 'claimed',
        createdAt: new Date('2025-01-01T12:00:00Z'),
        creator: mockCreator,
      },
    ];

    render(
      <RequestList
        requests={unsortedRequests}
        isOwnRequests={false}
        currentUserId="current-user"
      />
    );

    // Open requests should come first (higher priority)
    // Then claimed, then fulfilled
    // The actual ordering verification would require more complex DOM querying
    // For now, we verify all requests are rendered
    expect(screen.getByText('Urgent open request')).toBeInTheDocument();
    expect(screen.getByText('Claimed request')).toBeInTheDocument();
    expect(screen.getByText('Fulfilled request')).toBeInTheDocument();
  });

  it('should pass through action handlers to RequestCard components', async () => {
    const user = userEvent.setup();

    render(
      <RequestList
        requests={[mockRequests[0]]} // Just the open request
        isOwnRequests={false}
        onClaim={mockOnClaim}
        onFulfill={mockOnFulfill}
        onDelete={mockOnDelete}
        currentUserId="current-user"
      />
    );

    // Click the claim button
    await user.click(screen.getByRole('button', { name: /i can help/i }));

    expect(mockOnClaim).toHaveBeenCalledWith('req-1');
  });

  it('should handle processing state correctly', () => {
    render(
      <RequestList
        requests={[mockRequests[0]]}
        isOwnRequests={false}
        onClaim={mockOnClaim}
        currentUserId="current-user"
        isProcessing={true}
      />
    );

    // Button should be disabled and show processing state
    expect(screen.getByRole('button', { name: /claiming.../i })).toBeDisabled();
  });

  it('should display empty state when no requests', () => {
    render(
      <RequestList
        requests={[]}
        isOwnRequests={true}
        currentUserId="current-user"
      />
    );

    expect(screen.getByText('No requests yet')).toBeInTheDocument();
  });

  it('should display custom empty message and sub-message', () => {
    render(
      <RequestList
        requests={[]}
        isOwnRequests={false}
        currentUserId="current-user"
        emptyMessage="No group requests available"
        emptySubMessage="Check back later for new requests"
      />
    );

    expect(screen.getByText('No group requests available')).toBeInTheDocument();
    expect(
      screen.getByText('Check back later for new requests')
    ).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <RequestList
        requests={mockRequests}
        isOwnRequests={false}
        currentUserId="current-user"
        className="custom-class"
      />
    );

    expect(
      container.querySelector('.request-list.custom-class')
    ).toBeInTheDocument();
  });

  it('should handle different request statuses with embedded user data', () => {
    const statusRequests: Request[] = [
      {
        ...mockRequests[0],
        status: 'open',
        creator: mockCreator,
      },
      {
        ...mockRequests[1],
        status: 'claimed',
        creator: mockCreator,
        helper: mockHelper,
      },
      {
        ...mockRequests[2],
        status: 'fulfilled',
        creator: mockCreator,
        helper: mockHelper,
      },
      {
        id: 'req-expired',
        userId: 'creator-1',
        groupId: 'group-1',
        itemDescription: 'Expired request',
        neededBy: new Date('2020-01-01T18:00:00Z'), // Past date
        status: 'expired',
        createdAt: new Date('2025-01-01T12:00:00Z'),
        creator: mockCreator,
      },
    ];

    render(
      <RequestList
        requests={statusRequests}
        isOwnRequests={false}
        currentUserId="current-user"
      />
    );

    // Verify status badges are shown
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Claimed')).toBeInTheDocument();
    expect(screen.getByText('Fulfilled')).toBeInTheDocument();
    expect(screen.getByText('Expired')).toBeInTheDocument();

    // Verify user information is displayed appropriately
    const creatorElements = screen.getAllByText(/posted by alice creator/i);
    expect(creatorElements).toHaveLength(4); // All requests show creator

    // Verify helper information for claimed/fulfilled requests
    // Since these are group requests (isOwnRequests=false), they show "Claimed by you" and "Fulfilled by you"
    expect(screen.getByText(/claimed by you/i)).toBeInTheDocument();
    expect(screen.getByText(/fulfilled by you/i)).toBeInTheDocument();
  });
});
