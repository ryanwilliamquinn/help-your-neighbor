import React from 'react';
import type { UserLimitsWithCounts } from '@/types';
import './UserLimitsDisplay.css';

interface UserLimitsDisplayProps {
  limitsData: UserLimitsWithCounts;
  compact?: boolean;
}

interface LimitBarProps {
  label: string;
  current: number;
  max: number;
  type: 'requests' | 'groups-created' | 'groups-joined';
}

const LimitBar: React.FC<LimitBarProps> = ({ label, current, max, type }) => {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const isAtLimit = current >= max;
  const isNearLimit = current >= max * 0.8;

  let statusClass = 'limit-bar-fill';
  if (isAtLimit) {
    statusClass += ' limit-bar-fill--at-limit';
  } else if (isNearLimit) {
    statusClass += ' limit-bar-fill--near-limit';
  } else {
    statusClass += ' limit-bar-fill--normal';
  }

  return (
    <div className={`limit-item limit-item--${type}`}>
      <div className="limit-item-header">
        <span className="limit-item-label">{label}</span>
        <span className="limit-item-count">
          {current} / {max}
        </span>
      </div>
      <div className="limit-bar">
        <div
          className={statusClass}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isAtLimit && <div className="limit-item-warning">Limit reached</div>}
    </div>
  );
};

const UserLimitsDisplay: React.FC<UserLimitsDisplayProps> = ({
  limitsData,
  compact = false,
}) => {
  const { limits, counts } = limitsData;

  if (compact) {
    return (
      <div className="user-limits-compact">
        <div className="limits-summary">
          <span className="limits-summary-item">
            Requests: {counts.openRequestsCount}/{limits.maxOpenRequests}
          </span>
          <span className="limits-summary-item">
            Groups: {counts.groupsJoinedCount}/{limits.maxGroupsJoined}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="user-limits-display">
      <h3 className="user-limits-title">Your Usage</h3>
      <div className="user-limits-grid">
        <LimitBar
          label="Open Requests"
          current={counts.openRequestsCount}
          max={limits.maxOpenRequests}
          type="requests"
        />
        <LimitBar
          label="Groups Created"
          current={counts.groupsCreatedCount}
          max={limits.maxGroupsCreated}
          type="groups-created"
        />
        <LimitBar
          label="Groups Joined"
          current={counts.groupsJoinedCount}
          max={limits.maxGroupsJoined}
          type="groups-joined"
        />
      </div>
    </div>
  );
};

export default UserLimitsDisplay;
