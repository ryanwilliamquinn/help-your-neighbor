import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks';
import { apiService } from '@/services';
import type { PendingInvitation, Group } from '@/types';
import './PendingInvitations.css';

interface PendingInvitationsProps {
  onInvitationAccepted?: (group: Group) => void;
  onInvitationsChange?: () => void;
  className?: string;
}

const PendingInvitations: React.FC<PendingInvitationsProps> = ({
  onInvitationAccepted,
  onInvitationsChange,
  className,
}) => {
  const toast = useToast();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);

  useEffect(() => {
    loadPendingInvitations();
  }, []);

  const loadPendingInvitations = async (): Promise<void> => {
    try {
      setLoading(true);
      const pendingInvites = await apiService.getPendingInvitations();
      setInvitations(pendingInvites);
    } catch (error) {
      console.error('Failed to load pending invitations:', error);
      toast.error('Failed to load pending invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (
    invitation: PendingInvitation
  ): Promise<void> => {
    try {
      setProcessingInvite(invitation.id);
      const group = await apiService.acceptInvitation(invitation.token);

      // Remove from local state
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));

      toast.success(`Successfully joined ${group.name}!`);

      // Notify parent components
      onInvitationAccepted?.(group);
      onInvitationsChange?.();
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to accept invitation'
      );
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleDeclineInvitation = async (
    invitation: PendingInvitation
  ): Promise<void> => {
    try {
      setProcessingInvite(invitation.id);
      await apiService.declineInvitation(invitation.token);

      // Remove from local state
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));

      toast.success('Invitation declined');

      // Notify parent components
      onInvitationsChange?.();
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to decline invitation'
      );
    } finally {
      setProcessingInvite(null);
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
      <div className={`pending-invitations ${className || ''}`}>
        <div className="pending-invitations-loading">
          Loading invitations...
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show anything if no pending invitations
  }

  return (
    <div className={`pending-invitations ${className || ''}`}>
      <div className="pending-invitations-header">
        <h3>Pending Group Invitations</h3>
        <p className="pending-invitations-subtitle">
          You have {invitations.length} pending invitation
          {invitations.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="invitations-list">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="invitation-card">
            <div className="invitation-info">
              <div className="invitation-header">
                <h4 className="group-name">{invitation.groupName}</h4>
                <span className="invitation-meta">
                  Invited by {invitation.inviterName}
                </span>
              </div>

              <div className="invitation-details">
                <span className="invited-time">
                  Invited {formatTimeAgo(invitation.createdAt)}
                </span>
                <span className="expires-time">
                  {formatExpiresAt(invitation.expiresAt)}
                </span>
              </div>
            </div>

            <div className="invitation-actions">
              <button
                className="btn-secondary btn-small"
                onClick={() => handleDeclineInvitation(invitation)}
                disabled={processingInvite === invitation.id}
              >
                {processingInvite === invitation.id
                  ? 'Declining...'
                  : 'Decline'}
              </button>
              <button
                className="btn-primary btn-small"
                onClick={() => handleAcceptInvitation(invitation)}
                disabled={processingInvite === invitation.id}
              >
                {processingInvite === invitation.id ? 'Accepting...' : 'Accept'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingInvitations;
