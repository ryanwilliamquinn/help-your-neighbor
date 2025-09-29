import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PendingInvitations from './PendingInvitations';
import { useToast } from '@/hooks';
import { apiService } from '@/services';
import type { PendingInvitation, Group } from '@/types';

// Mock the hooks and services
jest.mock('@/hooks', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/services', () => ({
  apiService: {
    getPendingInvitations: jest.fn(),
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn(),
  },
}));

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

const mockInvitations: PendingInvitation[] = [
  {
    id: 'invite-1',
    groupId: 'group-1',
    groupName: 'Maple Street Neighbors',
    inviterName: 'John Doe',
    email: 'test@example.com',
    token: 'token-1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 'invite-2',
    groupId: 'group-2',
    groupName: 'Downtown Community',
    inviterName: 'Jane Smith',
    email: 'test@example.com',
    token: 'token-2',
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
];

const mockGroup: Group = {
  id: 'group-1',
  name: 'Maple Street Neighbors',
  createdBy: 'user-1',
  createdAt: new Date(),
};

describe('PendingInvitations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue(mockToast);
    (apiService.getPendingInvitations as jest.Mock).mockResolvedValue(
      mockInvitations
    );
  });

  it('renders loading state initially', async () => {
    render(<PendingInvitations />);

    expect(screen.getByText('Loading invitations...')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByText('Loading invitations...')
      ).not.toBeInTheDocument();
    });
  });

  it('renders pending invitations list', async () => {
    render(<PendingInvitations />);

    await waitFor(() => {
      expect(screen.getByText('Pending Group Invitations')).toBeInTheDocument();
      expect(
        screen.getByText('You have 2 pending invitations')
      ).toBeInTheDocument();
    });

    // Check that both invitations are displayed
    expect(screen.getByText('Maple Street Neighbors')).toBeInTheDocument();
    expect(screen.getByText('Downtown Community')).toBeInTheDocument();
    expect(screen.getByText('Invited by John Doe')).toBeInTheDocument();
    expect(screen.getByText('Invited by Jane Smith')).toBeInTheDocument();
  });

  it('does not render when no pending invitations', async () => {
    (apiService.getPendingInvitations as jest.Mock).mockResolvedValue([]);

    const { container } = render(<PendingInvitations />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('handles accepting an invitation successfully', async () => {
    const onInvitationAccepted = jest.fn();
    const onInvitationsChange = jest.fn();
    (apiService.acceptInvitation as jest.Mock).mockResolvedValue(mockGroup);

    // Mock getPendingInvitations to return updated data after acceptance
    (apiService.getPendingInvitations as jest.Mock)
      .mockResolvedValueOnce(mockInvitations) // Initial load
      .mockResolvedValueOnce([mockInvitations[1]]); // After accepting first invitation

    render(
      <PendingInvitations
        onInvitationAccepted={onInvitationAccepted}
        onInvitationsChange={onInvitationsChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Maple Street Neighbors')).toBeInTheDocument();
    });

    // Click accept button for first invitation
    const acceptButtons = screen.getAllByText('Accept');
    fireEvent.click(acceptButtons[0]);

    // Should show accepting state
    await waitFor(() => {
      expect(screen.getByText('Accepting...')).toBeInTheDocument();
    });

    // Wait for acceptance to complete
    await waitFor(() => {
      expect(apiService.acceptInvitation).toHaveBeenCalledWith('token-1');
      expect(mockToast.success).toHaveBeenCalledWith(
        'Successfully joined Maple Street Neighbors!'
      );
      expect(onInvitationAccepted).toHaveBeenCalledWith(mockGroup);
      expect(onInvitationsChange).toHaveBeenCalled();
    });

    // Invitation should be removed from the list
    expect(screen.queryByText('Invited by John Doe')).not.toBeInTheDocument();
    expect(
      screen.getByText('You have 1 pending invitation')
    ).toBeInTheDocument();
  });

  it('handles declining an invitation successfully', async () => {
    const onInvitationsChange = jest.fn();
    (apiService.declineInvitation as jest.Mock).mockResolvedValue(undefined);

    // Mock getPendingInvitations to return updated data after decline
    (apiService.getPendingInvitations as jest.Mock)
      .mockResolvedValueOnce(mockInvitations) // Initial load
      .mockResolvedValueOnce([mockInvitations[0]]); // After declining second invitation

    render(<PendingInvitations onInvitationsChange={onInvitationsChange} />);

    await waitFor(() => {
      expect(screen.getByText('Downtown Community')).toBeInTheDocument();
    });

    // Click decline button for second invitation
    const declineButtons = screen.getAllByText('Decline');
    fireEvent.click(declineButtons[1]);

    // Should show declining state
    await waitFor(() => {
      expect(screen.getByText('Declining...')).toBeInTheDocument();
    });

    // Wait for decline to complete
    await waitFor(() => {
      expect(apiService.declineInvitation).toHaveBeenCalledWith('token-2');
      expect(mockToast.success).toHaveBeenCalledWith('Invitation declined');
      expect(onInvitationsChange).toHaveBeenCalled();
    });

    // Invitation should be removed from the list
    expect(screen.queryByText('Invited by Jane Smith')).not.toBeInTheDocument();
    expect(
      screen.getByText('You have 1 pending invitation')
    ).toBeInTheDocument();
  });

  it('handles accept invitation error', async () => {
    const error = new Error('Failed to join group');
    (apiService.acceptInvitation as jest.Mock).mockRejectedValue(error);

    render(<PendingInvitations />);

    await waitFor(() => {
      expect(screen.getByText('Maple Street Neighbors')).toBeInTheDocument();
    });

    // Click accept button
    const acceptButtons = screen.getAllByText('Accept');
    fireEvent.click(acceptButtons[0]);

    // Wait for error handling
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to join group');
    });

    // Invitation should still be in the list
    expect(screen.getByText('Invited by John Doe')).toBeInTheDocument();
  });

  it('handles decline invitation error', async () => {
    const error = new Error('Network error');
    (apiService.declineInvitation as jest.Mock).mockRejectedValue(error);

    render(<PendingInvitations />);

    await waitFor(() => {
      expect(screen.getByText('Downtown Community')).toBeInTheDocument();
    });

    // Click decline button
    const declineButtons = screen.getAllByText('Decline');
    fireEvent.click(declineButtons[0]);

    // Wait for error handling
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Network error');
    });

    // Invitation should still be in the list
    expect(screen.getByText('Invited by Jane Smith')).toBeInTheDocument();
  });

  it('handles loading error gracefully', async () => {
    const error = new Error('Failed to load invitations');
    (apiService.getPendingInvitations as jest.Mock).mockRejectedValue(error);

    render(<PendingInvitations />);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to load pending invitations'
      );
    });

    // Should render nothing when loading fails
    expect(
      screen.queryByText('Pending Group Invitations')
    ).not.toBeInTheDocument();
  });

  it('disables buttons during processing', async () => {
    (apiService.acceptInvitation as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockGroup), 100))
    );

    render(<PendingInvitations />);

    await waitFor(() => {
      expect(screen.getByText('Maple Street Neighbors')).toBeInTheDocument();
    });

    // Click accept button for first invitation
    const acceptButtons = screen.getAllByText('Accept');
    const declineButtons = screen.getAllByText('Decline');

    fireEvent.click(acceptButtons[0]);

    // Both buttons for this invitation should be disabled
    await waitFor(() => {
      expect(screen.getByText('Accepting...')).toBeInTheDocument();
      expect(acceptButtons[0]).toBeDisabled();
      expect(declineButtons[0]).toBeDisabled();
    });

    // Other invitation buttons should still be enabled
    expect(acceptButtons[1]).not.toBeDisabled();
    expect(declineButtons[1]).not.toBeDisabled();
  });

  it('formats time correctly', async () => {
    const recentInvitation: PendingInvitation = {
      ...mockInvitations[0],
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    };

    (apiService.getPendingInvitations as jest.Mock).mockResolvedValue([
      recentInvitation,
    ]);

    render(<PendingInvitations />);

    await waitFor(() => {
      expect(screen.getByText(/30 minute/)).toBeInTheDocument();
      expect(screen.getByText(/hour/)).toBeInTheDocument(); // More flexible check
    });
  });

  it('applies custom className', async () => {
    const { container } = render(
      <PendingInvitations className="custom-class" />
    );

    await waitFor(() => {
      expect(container.firstChild).toHaveClass('pending-invitations');
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
