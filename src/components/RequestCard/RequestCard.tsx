import React from 'react';
import type { Request } from '@/types';
import { sanitizeForDisplay } from '@/utils';
import './RequestCard.css';

interface RequestCardProps {
  request: Request;
  isOwnRequest?: boolean;
  onClaim?: (requestId: string) => Promise<void>;
  onUnclaim?: (requestId: string) => Promise<void>;
  onFulfill?: (requestId: string) => Promise<void>;
  onDelete?: (requestId: string) => Promise<void>;
  currentUserId?: string;
  isProcessing?: boolean;
}

const RequestCard = ({
  request,
  isOwnRequest = false,
  onClaim,
  onUnclaim,
  onFulfill,
  onDelete,
  currentUserId,
  isProcessing = false,
}: RequestCardProps): React.JSX.Element => {
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusDisplay = (): string => {
    switch (request.status) {
      case 'open':
        return 'Open';
      case 'claimed':
        return 'Claimed';
      case 'fulfilled':
        return 'Fulfilled';
      case 'expired':
        return 'Expired';
      default:
        return request.status;
    }
  };

  const isExpired = (): boolean => {
    return new Date(request.neededBy) < new Date();
  };

  const canClaim = (): boolean => {
    return (
      !isOwnRequest && request.status === 'open' && !isExpired() && !!onClaim
    );
  };

  const canUnclaim = (): boolean => {
    return (
      !isOwnRequest &&
      request.status === 'claimed' &&
      request.claimedBy === currentUserId &&
      !!onUnclaim
    );
  };

  const canFulfill = (): boolean => {
    return (
      request.status === 'claimed' &&
      request.claimedBy === currentUserId &&
      !!onFulfill
    );
  };

  const canDelete = (): boolean => {
    return isOwnRequest && request.status !== 'fulfilled' && !!onDelete;
  };

  const handleClaim = async (): Promise<void> => {
    if (onClaim && canClaim()) {
      await onClaim(request.id);
    }
  };

  const handleUnclaim = async (): Promise<void> => {
    if (onUnclaim && canUnclaim()) {
      await onUnclaim(request.id);
    }
  };

  const handleFulfill = async (): Promise<void> => {
    if (onFulfill && canFulfill()) {
      await onFulfill(request.id);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (onDelete && canDelete()) {
      const confirmed = window.confirm(
        'Are you sure you want to delete this request? This action cannot be undone.'
      );
      if (confirmed) {
        await onDelete(request.id);
      }
    }
  };

  return (
    <div
      className={`request-card ${isOwnRequest ? 'own-request' : 'group-request'} ${request.status}`}
    >
      <div className="request-header">
        <h3 className="request-item">
          {sanitizeForDisplay(request.itemDescription)}
        </h3>
        <span className={`status-badge status-${request.status}`}>
          {getStatusDisplay()}
        </span>
      </div>

      <div className="request-details">
        <div className="request-meta">
          <span className="needed-by">
            Needed by: {formatDate(request.neededBy)}
            {isExpired() && (
              <span className="expired-indicator"> (Expired)</span>
            )}
          </span>
        </div>

        {request.storePreference && (
          <div className="store-preference">
            <strong>Preferred store:</strong>{' '}
            {sanitizeForDisplay(request.storePreference)}
          </div>
        )}

        {request.pickupNotes && (
          <div className="pickup-notes">
            <strong>Notes:</strong> {sanitizeForDisplay(request.pickupNotes)}
          </div>
        )}

        {request.claimedBy &&
          (request.status === 'claimed' || request.status === 'fulfilled') && (
            <div className="claimed-info">
              <span className="claimed-badge">
                {isOwnRequest
                  ? `${request.status === 'fulfilled' ? 'Fulfilled by' : 'Being helped by'} ${sanitizeForDisplay(request.helper?.name || 'someone')}`
                  : `${request.status === 'fulfilled' ? 'Fulfilled by you' : 'Claimed by you'}`}
              </span>
              {request.claimedAt && (
                <span className="claimed-date">
                  on {formatDate(request.claimedAt)}
                </span>
              )}
            </div>
          )}

        {/* Show creator information for group requests */}
        {!isOwnRequest && request.creator && (
          <div className="creator-info">
            <span className="creator-name">
              Posted by {sanitizeForDisplay(request.creator.name)}
            </span>
          </div>
        )}
      </div>

      <div className="request-actions">
        {canClaim() && (
          <button
            className="btn-primary btn-small"
            onClick={handleClaim}
            disabled={isProcessing}
          >
            {isProcessing ? 'Claiming...' : 'I can help!'}
          </button>
        )}

        {canUnclaim() && (
          <button
            className="btn-secondary btn-small"
            onClick={handleUnclaim}
            disabled={isProcessing}
          >
            {isProcessing ? 'Unclaiming...' : 'Cannot help anymore'}
          </button>
        )}

        {canFulfill() && (
          <button
            className="btn-success btn-small"
            onClick={handleFulfill}
            disabled={isProcessing}
          >
            {isProcessing ? 'Marking as done...' : 'Mark as fulfilled'}
          </button>
        )}

        {canDelete() && (
          <button
            className="btn-danger btn-small"
            onClick={handleDelete}
            disabled={isProcessing}
          >
            {isProcessing ? 'Deleting...' : 'Delete Request'}
          </button>
        )}

        {isOwnRequest && request.status === 'open' && !canDelete() && (
          <div className="request-status-text">Waiting for someone to help</div>
        )}

        {isOwnRequest && request.status === 'fulfilled' && (
          <div className="request-status-text success">
            Completed! Thanks to your neighbor.
          </div>
        )}
      </div>

      <div className="request-footer">
        <span className="created-date">
          Posted {formatDate(request.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default RequestCard;
