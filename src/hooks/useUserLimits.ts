import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services';
import type { UserLimitsWithCounts } from '@/types';

interface UseUserLimitsReturn {
  limitsData: UserLimitsWithCounts | null;
  loading: boolean;
  error: string | null;
  canCreateRequest: boolean;
  canCreateGroup: boolean;
  canJoinGroup: boolean;
  refreshLimits: () => Promise<void>;
}

export const useUserLimits = (): UseUserLimitsReturn => {
  const [limitsData, setLimitsData] = useState<UserLimitsWithCounts | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getUserLimitsWithCounts();
      setLimitsData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load user limits'
      );
      setLimitsData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshLimits = useCallback(async () => {
    await fetchLimits();
  }, [fetchLimits]);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  // Calculate if actions are allowed
  const canCreateRequest = limitsData
    ? limitsData.counts.openRequestsCount < limitsData.limits.maxOpenRequests
    : false;

  const canCreateGroup = limitsData
    ? limitsData.counts.groupsCreatedCount < limitsData.limits.maxGroupsCreated
    : false;

  const canJoinGroup = limitsData
    ? limitsData.counts.groupsJoinedCount < limitsData.limits.maxGroupsJoined
    : false;

  return {
    limitsData,
    loading,
    error,
    canCreateRequest,
    canCreateGroup,
    canJoinGroup,
    refreshLimits,
  };
};
