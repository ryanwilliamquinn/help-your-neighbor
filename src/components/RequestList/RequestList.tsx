import React from 'react';
import type { Request } from '@/types';
import RequestCard from '@/components/RequestCard/RequestCard';
import './RequestList.css';

interface RequestListProps {
  requests: Request[];
  isOwnRequests?: boolean;
  onClaim?: (requestId: string) => Promise<void>;
  onUnclaim?: (requestId: string) => Promise<void>;
  onFulfill?: (requestId: string) => Promise<void>;
  onDelete?: (requestId: string) => Promise<void>;
  currentUserId?: string;
  isProcessing?: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
  className?: string;
}

const RequestList = ({
  requests,
  isOwnRequests = false,
  onClaim,
  onUnclaim,
  onFulfill,
  onDelete,
  currentUserId,
  isProcessing = false,
  emptyMessage = 'No requests yet',
  emptySubMessage,
  className = '',
}: RequestListProps): React.JSX.Element => {
  if (requests.length === 0) {
    return (
      <div className={`request-list-empty ${className}`}>
        <div className="empty-state">
          <p className="empty-message">{emptyMessage}</p>
          {emptySubMessage && (
            <p className="empty-sub-message">{emptySubMessage}</p>
          )}
        </div>
      </div>
    );
  }

  // Sort requests by status and date
  const sortedRequests = [...requests].sort((a, b) => {
    // First sort by status priority (open > claimed > fulfilled > expired)
    const statusPriority = {
      open: 1,
      claimed: 2,
      fulfilled: 3,
      expired: 4,
    };

    const statusDiff = statusPriority[a.status] - statusPriority[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Then sort by needed by date (sooner first)
    const dateA = new Date(a.neededBy).getTime();
    const dateB = new Date(b.neededBy).getTime();
    return dateA - dateB;
  });

  return (
    <div className={`request-list ${className}`}>
      <div className="request-list-container">
        {sortedRequests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            isOwnRequest={isOwnRequests}
            onClaim={onClaim}
            onUnclaim={onUnclaim}
            onFulfill={onFulfill}
            onDelete={onDelete}
            currentUserId={currentUserId}
            isProcessing={isProcessing}
          />
        ))}
      </div>
    </div>
  );
};

export default RequestList;
