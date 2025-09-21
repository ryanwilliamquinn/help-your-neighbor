import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RequestCard from './RequestCard';
import type { Request } from '@/types';

describe('RequestCard', () => {
  const mockRequest: Request = {
    id: '1',
    userId: 'user1',
    groupId: 'group1',
    itemDescription: 'Milk and bread',
    storePreference: 'Trader Joes',
    neededBy: new Date('2025-12-31T18:00:00Z'),
    pickupNotes: 'Any brand is fine',
    status: 'open',
    createdAt: new Date('2025-01-01T12:00:00Z'),
  };

  const mockOnClaim = jest.fn();
  const mockOnFulfill = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render request details', () => {
    render(<RequestCard request={mockRequest} />);

    expect(screen.getByText('Milk and bread')).toBeInTheDocument();
    expect(screen.getByText(/needed by:/i)).toBeInTheDocument();
    expect(screen.getByText(/preferred store:/i)).toBeInTheDocument();
    expect(screen.getByText('Trader Joes')).toBeInTheDocument();
    expect(screen.getByText(/notes:/i)).toBeInTheDocument();
    expect(screen.getByText('Any brand is fine')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('should show claim button for group requests', () => {
    render(
      <RequestCard
        request={mockRequest}
        isOwnRequest={false}
        onClaim={mockOnClaim}
        currentUserId="user2"
      />
    );

    expect(
      screen.getByRole('button', { name: /i can help/i })
    ).toBeInTheDocument();
  });

  it('should call onClaim when claim button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RequestCard
        request={mockRequest}
        isOwnRequest={false}
        onClaim={mockOnClaim}
        currentUserId="user2"
      />
    );

    await user.click(screen.getByRole('button', { name: /i can help/i }));

    expect(mockOnClaim).toHaveBeenCalledWith('1');
  });

  it('should show fulfill button for claimed requests by current user', () => {
    const claimedRequest: Request = {
      ...mockRequest,
      status: 'claimed',
      claimedBy: 'user2',
      claimedAt: new Date('2025-01-02T12:00:00Z'),
    };

    render(
      <RequestCard
        request={claimedRequest}
        isOwnRequest={false}
        onFulfill={mockOnFulfill}
        currentUserId="user2"
      />
    );

    expect(
      screen.getByRole('button', { name: /mark as fulfilled/i })
    ).toBeInTheDocument();
  });

  it('should call onFulfill when fulfill button is clicked', async () => {
    const user = userEvent.setup();
    const claimedRequest: Request = {
      ...mockRequest,
      status: 'claimed',
      claimedBy: 'user2',
      claimedAt: new Date('2025-01-02T12:00:00Z'),
    };

    render(
      <RequestCard
        request={claimedRequest}
        isOwnRequest={false}
        onFulfill={mockOnFulfill}
        currentUserId="user2"
      />
    );

    await user.click(
      screen.getByRole('button', { name: /mark as fulfilled/i })
    );

    expect(mockOnFulfill).toHaveBeenCalledWith('1');
  });

  it('should show appropriate status for own requests', () => {
    render(<RequestCard request={mockRequest} isOwnRequest={true} />);

    expect(
      screen.getByText(/waiting for someone to help/i)
    ).toBeInTheDocument();
  });

  it('should handle expired requests', () => {
    const expiredRequest: Request = {
      ...mockRequest,
      neededBy: new Date('2020-01-01T12:00:00Z'), // Past date
    };

    render(<RequestCard request={expiredRequest} />);

    expect(screen.getByText(/expired/i)).toBeInTheDocument();
  });

  it('should disable buttons when processing', () => {
    render(
      <RequestCard
        request={mockRequest}
        isOwnRequest={false}
        onClaim={mockOnClaim}
        currentUserId="user2"
        isProcessing={true}
      />
    );

    expect(screen.getByRole('button', { name: /claiming.../i })).toBeDisabled();
  });

  it('should show claimed status correctly', () => {
    const claimedRequest: Request = {
      ...mockRequest,
      status: 'claimed',
      claimedBy: 'user2',
      claimedAt: new Date('2025-01-02T12:00:00Z'),
    };

    // Test as own request
    render(<RequestCard request={claimedRequest} isOwnRequest={true} />);
    expect(screen.getByText(/being helped by someone/i)).toBeInTheDocument();
  });
});
