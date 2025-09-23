import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, useToast } from '@/hooks';
import { apiService } from '@/services';
import type {
  Request,
  Group,
  User,
  CreateRequestForm as CreateRequestFormData,
} from '@/types';
import CreateRequestForm from '@/components/CreateRequestForm/CreateRequestForm';
import RequestList from '@/components/RequestList/RequestList';
import './DashboardPage.css';

const DashboardPage = (): React.JSX.Element => {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [userRequests, setUserRequests] = useState<Request[]>([]);
  const [groupRequests, setGroupRequests] = useState<Request[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaimingRequest, setIsClaimingRequest] = useState(false);
  const [isFulfillingRequest, setIsFulfillingRequest] = useState(false);
  const [isDeletingRequest, setIsDeletingRequest] = useState(false);
  const loadingRef = useRef(false);
  const hasLoadedRef = useRef<string | null>(null);

  const loadDashboardData = useCallback(async (): Promise<void> => {
    if (!user || loadingRef.current) return;

    const userId = user.id || user.email; // Fallback to email for tests
    if (hasLoadedRef.current === userId) return;

    loadingRef.current = true;
    hasLoadedRef.current = userId;

    try {
      setLoadingData(true);

      // Load user's groups first
      const groups = await apiService.getUserGroups();
      setUserGroups(groups);

      // Load all requests
      const userRequests = await apiService.getUserRequests();
      const allGroupRequests: Request[] = [];
      for (const group of groups) {
        const groupRequests = await apiService.getGroupRequests(group.id);
        const otherMemberRequests = groupRequests.filter(
          (req) => req.userId !== (user.id || user.email)
        );
        allGroupRequests.push(...otherMemberRequests);
      }

      // Batch load all user data
      const allRequests = [...userRequests, ...allGroupRequests];
      const allUserIds = [
        ...allRequests.map((req) => req.userId), // creators
        ...allRequests
          .filter((req) => req.claimedBy)
          .map((req) => req.claimedBy!), // helpers
      ].filter((id, index, array) => array.indexOf(id) === index); // remove duplicates

      try {
        const allUsers = await apiService.getUsersByIds(allUserIds);
        const usersMap = allUsers.reduce(
          (map, user) => {
            map[user.id] = user;
            return map;
          },
          {} as Record<string, User>
        );

        // Attach user data to requests
        const enhancedUserRequests = userRequests.map((req) => ({
          ...req,
          creator: usersMap[req.userId],
          helper: req.claimedBy ? usersMap[req.claimedBy] : undefined,
        }));

        const enhancedGroupRequests = allGroupRequests.map((req) => ({
          ...req,
          creator: usersMap[req.userId],
          helper: req.claimedBy ? usersMap[req.claimedBy] : undefined,
        }));

        setUserRequests(enhancedUserRequests);
        setGroupRequests(enhancedGroupRequests);
      } catch {
        // Failed to load user data, continuing without user info
        // Set requests without user data enhancement
        setUserRequests(userRequests);
        setGroupRequests(allGroupRequests);
      }
    } catch {
      // Failed to load dashboard data
      toast.error('Unable to load dashboard data. Please refresh the page.');
    } finally {
      setLoadingData(false);
      loadingRef.current = false;
    }
  }, [user, toast]);

  const handleCreateRequest = async (
    requestData: CreateRequestFormData
  ): Promise<void> => {
    try {
      setIsSubmitting(true);
      const newRequest = await apiService.createRequest(requestData);
      setUserRequests((prev) => [newRequest, ...prev]);
      setShowCreateForm(false);
      // Reset the loaded flag so data can be refreshed
      hasLoadedRef.current = null;
      toast.success('Request created successfully!');
    } catch (error) {
      // Failed to create request
      toast.error(
        error instanceof Error ? error.message : 'Failed to create request'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    if (user) {
      // Reset loading state when user changes
      const userId = user.id || user.email;
      if (hasLoadedRef.current !== userId) {
        loadingRef.current = false;
      }
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email]); // Only depend on user ID to prevent infinite loops

  const handleCancelCreate = (): void => {
    setShowCreateForm(false);
  };

  const handleClaimRequest = async (requestId: string): Promise<void> => {
    try {
      setIsClaimingRequest(true);
      const updatedRequest = await apiService.claimRequest(requestId);

      // Update both user and group requests lists
      setGroupRequests((prev) =>
        prev.map((req) => (req.id === requestId ? updatedRequest : req))
      );
      setUserRequests((prev) =>
        prev.map((req) => (req.id === requestId ? updatedRequest : req))
      );
      toast.success('Request claimed successfully!');
    } catch (error) {
      // Failed to claim request
      toast.error(
        error instanceof Error ? error.message : 'Failed to claim request'
      );
    } finally {
      setIsClaimingRequest(false);
    }
  };

  const handleUnclaimRequest = async (requestId: string): Promise<void> => {
    try {
      setIsClaimingRequest(true);
      const updatedRequest = await apiService.unclaimRequest(requestId);
      // Update both user and group requests lists
      setGroupRequests((prev) =>
        prev.map((req) => (req.id === requestId ? updatedRequest : req))
      );
      setUserRequests((prev) =>
        prev.map((req) => (req.id === requestId ? updatedRequest : req))
      );
      toast.success('Request unclaimed successfully!');
    } catch (error) {
      // Failed to unclaim request
      toast.error(
        error instanceof Error ? error.message : 'Failed to unclaim request'
      );
    } finally {
      setIsClaimingRequest(false);
    }
  };

  const handleFulfillRequest = async (requestId: string): Promise<void> => {
    try {
      setIsFulfillingRequest(true);
      const updatedRequest = await apiService.fulfillRequest(requestId);

      // Update both user and group requests lists
      setGroupRequests((prev) =>
        prev.map((req) => (req.id === requestId ? updatedRequest : req))
      );
      setUserRequests((prev) =>
        prev.map((req) => (req.id === requestId ? updatedRequest : req))
      );
      toast.success('Request fulfilled successfully!');
    } catch (error) {
      // Failed to fulfill request
      toast.error(
        error instanceof Error ? error.message : 'Failed to fulfill request'
      );
    } finally {
      setIsFulfillingRequest(false);
    }
  };

  const handleDeleteRequest = async (requestId: string): Promise<void> => {
    try {
      setIsDeletingRequest(true);
      await apiService.deleteRequest(requestId);

      // Remove the request from both user and group requests lists
      setUserRequests((prev) => prev.filter((req) => req.id !== requestId));
      setGroupRequests((prev) => prev.filter((req) => req.id !== requestId));
      toast.success('Request deleted successfully!');
    } catch (error) {
      // Failed to delete request
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete request'
      );
    } finally {
      setIsDeletingRequest(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="dashboard-error">
        Please log in to view your dashboard.
      </div>
    );
  }

  if (loadingData) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Welcome back, {user.name}!</h1>
        <p className="dashboard-subtitle">
          Here's what's happening in your groups
        </p>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-grid">
          {/* User's Requests Section */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Your Requests</h2>
              <button
                className="btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                + New Request
              </button>
            </div>
            <div className="requests-container">
              {userRequests.length === 0 ? (
                <div className="empty-state">
                  <p>You haven't posted any requests yet.</p>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowCreateForm(true)}
                  >
                    Create your first request
                  </button>
                </div>
              ) : (
                <RequestList
                  requests={userRequests}
                  isOwnRequests={true}
                  onFulfill={handleFulfillRequest}
                  onDelete={handleDeleteRequest}
                  currentUserId={user?.id}
                  isProcessing={isFulfillingRequest || isDeletingRequest}
                />
              )}
            </div>
          </section>

          {/* Available Requests from Group */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Help Your Neighbors</h2>
              <span className="section-subtitle">
                Requests you can help with
              </span>
            </div>
            <div className="requests-container">
              <RequestList
                requests={groupRequests}
                isOwnRequests={false}
                onClaim={handleClaimRequest}
                onUnclaim={handleUnclaimRequest}
                onFulfill={handleFulfillRequest}
                currentUserId={user?.id}
                isProcessing={isClaimingRequest || isFulfillingRequest}
                emptyMessage="No requests from your group members right now."
                emptySubMessage="Check back later!"
              />
            </div>
          </section>
        </div>

        {/* Groups Section */}
        <section className="dashboard-section groups-section">
          <div className="section-header">
            <h2>Your Groups</h2>
            <button
              className="btn-secondary"
              onClick={() => (window.location.href = '/groups')}
            >
              View All Groups
            </button>
          </div>
          <div className="groups-container">
            {userGroups.length === 0 ? (
              <div className="empty-state">
                <p>You're not part of any groups yet.</p>
                <p className="empty-state-sub">
                  Ask a friend to invite you to their group!
                </p>
              </div>
            ) : (
              <div className="groups-list">
                {userGroups.map((group) => (
                  <div key={group.id} className="group-card">
                    <h3>{group.name}</h3>
                    <p className="group-meta">
                      Joined {new Date(group.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Create Request Form Modal */}
      {showCreateForm && (
        <CreateRequestForm
          onSubmit={handleCreateRequest}
          onCancel={handleCancelCreate}
          isSubmitting={isSubmitting}
          userGroups={userGroups}
        />
      )}
    </div>
  );
};

export default DashboardPage;
