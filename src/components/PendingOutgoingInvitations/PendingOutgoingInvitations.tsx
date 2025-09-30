import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks';
import { apiService } from '@/services';
import type { PendingOutgoingInvitation } from '@/types';
import './PendingOutgoingInvitations.css';

interface PendingOutgoingInvitationsProps {
  refreshTrigger?: number;
  onInvitationsChange?: () => void;
  className?: string;
}

const PendingOutgoingInvitations: React.FC<PendingOutgoingInvitationsProps> = ({
  refreshTrigger,
  onInvitationsChange,
  className,
}) => {
  const toast = useToast();
  const [invitations, setInvitations] = useState<PendingOutgoingInvitation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [cancelingInvite, setCancelingInvite] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{
    id: string;
    email: string;
    groupName: string;
  } | null>(null);

  const loadOutgoingInvitations = async (): Promise<void> => {
    try {
      setLoading(true);
      const outgoingInvites = await apiService.getPendingOutgoingInvitations();
      setInvitations(outgoingInvites);
    } catch (error) {
      console.error('Failed to load outgoing invitations:', error);
      toast.error('Failed to load pending invitations you sent');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutgoingInvitations();
  }, [refreshTrigger]);

  const handleCancelInvitation = async (
    invitation: PendingOutgoingInvitation
  ): Promise<void> => {
    try {
      setCancelingInvite(invitation.id);
      await apiService.cancelInvitation(invitation.id);

      // Remove from local state immediately for better UX
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));

      toast.success(`Invitation to ${invitation.email} cancelled`);

      // Notify parent component
      onInvitationsChange?.();

      // Reload invitations from server to ensure consistency
      await loadOutgoingInvitations();
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to cancel invitation'
      );
    } finally {
      setCancelingInvite(null);
      setConfirmCancel(null);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  };

  const formatExpiresAt = (date: Date): string => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `Expires in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    } else if (diffHours > 0) {
      return `Expires in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
    } else {
      return 'Expires soon';
    }
  };

  if (loading) {
    return (
      <div className={`pending-outgoing-invitations ${className || ''}`}>
        <div className="pending-outgoing-invitations-loading">
          Loading sent invitations...
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show anything if no pending outgoing invitations
  }

  return (
    <div className={`pending-outgoing-invitations ${className || ''}`}>
      <div className="pending-outgoing-invitations-header">
        <h3>Invitations You've Sent</h3>
        <p className="pending-outgoing-invitations-subtitle">
          {invitations.length} pending invitation
          {invitations.length === 1 ? '' : 's'} waiting for response
        </p>
      </div>

      <div className="outgoing-invitations-list">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="outgoing-invitation-card">
            <div className="outgoing-invitation-info">
              <div className="outgoing-invitation-header">
                <span className="invited-email">{invitation.email}</span>
                <span className="group-name">to {invitation.groupName}</span>
              </div>

              <div className="outgoing-invitation-details">
                <span className="sent-time">
                  Sent {formatTimeAgo(invitation.createdAt)}
                </span>
                <span className="expires-time">
                  {formatExpiresAt(invitation.expiresAt)}
                </span>
              </div>
            </div>

            <div className="outgoing-invitation-actions">
              <button
                className="btn-danger btn-small"
                onClick={() =>
                  setConfirmCancel({
                    id: invitation.id,
                    email: invitation.email,
                    groupName: invitation.groupName,
                  })
                }
                disabled={cancelingInvite === invitation.id}
              >
                {cancelingInvite === invitation.id ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {confirmCancel && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Cancel Invitation</h3>
            <p>
              Are you sure you want to cancel the invitation to{' '}
              <strong>{confirmCancel.email}</strong> for group{' '}
              <strong>"{confirmCancel.groupName}"</strong>?
            </p>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setConfirmCancel(null)}
                disabled={cancelingInvite === confirmCancel.id}
              >
                Keep Invitation
              </button>
              <button
                className="btn-danger"
                onClick={() =>
                  handleCancelInvitation({
                    id: confirmCancel.id,
                    email: confirmCancel.email,
                    groupName: confirmCancel.groupName,
                  } as PendingOutgoingInvitation)
                }
                disabled={cancelingInvite === confirmCancel.id}
              >
                {cancelingInvite === confirmCancel.id
                  ? 'Cancelling...'
                  : 'Cancel Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingOutgoingInvitations;
