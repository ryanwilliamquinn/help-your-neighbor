import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth, useToast, useUserLimits } from '@/hooks';
import { apiService } from '@/services';
import type { Group, User } from '@/types';
import { UserLimitsDisplay } from '@/components/UserLimits';
import './GroupsPage.css';

const GroupsPage = (): React.JSX.Element => {
  const { user, loading } = useAuth();
  const toast = useToast();
  const { limitsData, canCreateGroup, refreshLimits } = useUserLimits();
  const [searchParams] = useSearchParams();
  const highlightGroupId = searchParams.get('highlight');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitingGroupId, setInvitingGroupId] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [viewingMembersGroupId, setViewingMembersGroupId] = useState<
    string | null
  >(null);
  const [groupMembers, setGroupMembers] = useState<{
    [groupId: string]: User[];
  }>({});
  const [loadingMembers, setLoadingMembers] = useState<string | null>(null);
  const [leavingGroup, setLeavingGroup] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async (): Promise<void> => {
    try {
      setLoadingGroups(true);
      const userGroups = await apiService.getUserGroups();
      setGroups(userGroups);

      // Load member counts for all groups
      const memberData: { [groupId: string]: User[] } = {};
      for (const group of userGroups) {
        const members = await apiService.getGroupMembers(group.id);
        memberData[group.id] = members;
      }
      setGroupMembers(memberData);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleCreateGroup = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      setCreating(true);
      const newGroup = await apiService.createGroup(groupName.trim());
      setGroups((prev) => [...prev, newGroup]);
      setGroupName('');
      setShowCreateForm(false);
      // Refresh limits after creating a group
      await refreshLimits();
      toast.success('Group created successfully!');
    } catch (error) {
      // Failed to create group
      toast.error(
        error instanceof Error ? error.message : 'Failed to create group'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleCancelCreate = (): void => {
    setShowCreateForm(false);
    setGroupName('');
    setError(null);
  };

  const handleInviteMember = async (groupId: string): Promise<void> => {
    if (!inviteEmail.trim()) {
      toast.error('Email address is required');
      return;
    }

    try {
      const invite = await apiService.createInvite(groupId, inviteEmail.trim());
      const inviteUrl = `${window.location.origin}/invite?token=${invite.token}`;
      toast.success(`Invitation created! Share this link: ${inviteUrl}`);
      setInviteEmail('');
      setInvitingGroupId(null);
    } catch (error) {
      // Failed to create invitation
      toast.error(
        error instanceof Error ? error.message : 'Failed to create invitation'
      );
    }
  };

  const handleStartInvite = (groupId: string): void => {
    setInvitingGroupId(groupId);
    setInviteEmail('');
    setInviteError(null);
    setInviteSuccess(null);
  };

  const handleCancelInvite = (): void => {
    setInvitingGroupId(null);
    setInviteEmail('');
    setInviteError(null);
    setInviteSuccess(null);
  };

  const handleViewMembers = async (groupId: string): Promise<void> => {
    // Toggle display if already viewing this group
    if (viewingMembersGroupId === groupId) {
      setViewingMembersGroupId(null);
      return;
    }

    if (groupMembers[groupId]) {
      // Already loaded, just show
      setViewingMembersGroupId(groupId);
      return;
    }

    try {
      setLoadingMembers(groupId);
      const members = await apiService.getGroupMembers(groupId);
      setGroupMembers((prev) => ({
        ...prev,
        [groupId]: members,
      }));
      setViewingMembersGroupId(groupId);
    } finally {
      setLoadingMembers(null);
    }
  };

  const handleCloseMembersList = (): void => {
    setViewingMembersGroupId(null);
  };

  const handleLeaveGroup = async (groupId: string): Promise<void> => {
    if (!confirm('Are you sure you want to leave this group?')) {
      return;
    }

    try {
      setLeavingGroup(groupId);
      setError(null);
      await apiService.leaveGroup(groupId);

      // Remove group from local state
      setGroups((prev) => prev.filter((g) => g.id !== groupId));

      // Clear related state
      setGroupMembers((prev) => {
        const newMembers = { ...prev };
        delete newMembers[groupId];
        return newMembers;
      });

      if (viewingMembersGroupId === groupId) {
        setViewingMembersGroupId(null);
      }

      toast.success('Successfully left the group');
    } catch (error) {
      // Failed to leave group
      toast.error(
        error instanceof Error ? error.message : 'Failed to leave group'
      );
    } finally {
      setLeavingGroup(null);
    }
  };

  const handleRemoveMember = async (
    groupId: string,
    userId: string,
    memberName: string
  ): Promise<void> => {
    if (
      !confirm(`Are you sure you want to remove ${memberName} from this group?`)
    ) {
      return;
    }

    try {
      setRemovingMember(userId);
      setError(null);
      await apiService.removeGroupMember(groupId, userId);

      // Update local members state
      setGroupMembers((prev) => ({
        ...prev,
        [groupId]:
          prev[groupId]?.filter((member) => member.id !== userId) || [],
      }));

      toast.success(`Successfully removed ${memberName} from the group`);
    } catch (error) {
      // Failed to remove member
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove member'
      );
    } finally {
      setRemovingMember(null);
    }
  };

  if (loading || loadingGroups) {
    return <div className="groups-loading">Loading groups...</div>;
  }

  if (!user) {
    return (
      <div className="groups-error">Please log in to view your groups.</div>
    );
  }

  return (
    <div className="groups-page">
      <header className="groups-header">
        <h1>Your Groups</h1>
        <p className="groups-subtitle">Manage the groups you belong to</p>
      </header>

      {/* User Limits Display */}
      {limitsData && <UserLimitsDisplay limitsData={limitsData} compact />}

      <div className="groups-content">
        <div className="groups-actions">
          {!showCreateForm && (
            <button
              className={`btn-primary ${!canCreateGroup ? 'btn-disabled' : ''}`}
              onClick={() => canCreateGroup && setShowCreateForm(true)}
              disabled={!canCreateGroup}
              title={
                !canCreateGroup
                  ? 'You have reached your limit of groups created'
                  : 'Create a new group'
              }
            >
              + Create New Group
            </button>
          )}
        </div>

        {showCreateForm && (
          <div className="create-group-form">
            <h3>Create New Group</h3>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label htmlFor="groupName">Group Name *</label>
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Maple Street Neighbors, Downtown Friends..."
                  disabled={creating}
                  autoFocus
                />
              </div>

              {error && (
                <div
                  className="error-message"
                  style={{
                    background: '#ffebee',
                    color: '#c62828',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #ffcdd2',
                    marginBottom: '1rem',
                  }}
                >
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelCreate}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating || !groupName.trim()}
                >
                  {creating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Success message for invites */}
        {inviteSuccess && (
          <div
            className="invite-success-message"
            style={{
              background: '#e8f5e8',
              color: '#2e7d32',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #c8e6c9',
              marginBottom: '2rem',
              fontSize: '0.95rem',
              wordBreak: 'break-all',
            }}
          >
            ✅ {inviteSuccess}
            <button
              style={{
                marginLeft: '1rem',
                background: 'none',
                border: 'none',
                color: '#2e7d32',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
              onClick={() => setInviteSuccess(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="groups-list">
          {groups.length === 0 ? (
            <div className="empty-state">
              <h3>No groups yet</h3>
              <p>You'll see your groups here once you join or create one.</p>
              <p className="empty-state-sub">
                Ask a friend to send you an invite link to join their group!
              </p>
            </div>
          ) : (
            <div className="groups-grid">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`group-card ${
                    highlightGroupId === group.id
                      ? 'group-card-highlighted'
                      : ''
                  }`}
                >
                  <div className="group-header">
                    <h3 className="group-name">{group.name}</h3>
                    <span className="group-role">
                      {group.createdBy === user.id ? 'Owner' : 'Member'}
                    </span>
                  </div>

                  <div className="group-details">
                    <p className="group-created">
                      Created {new Date(group.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="group-stats">
                    <span className="member-count">
                      {groupMembers[group.id]
                        ? `${groupMembers[group.id].length} member${groupMembers[group.id].length === 1 ? '' : 's'}`
                        : 'Group member'}
                    </span>
                  </div>

                  {/* Members section */}
                  {viewingMembersGroupId === group.id &&
                    groupMembers[group.id] && (
                      <div className="members-list">
                        <h4>Group Members</h4>
                        <div className="members-grid">
                          {groupMembers[group.id].map((member) => (
                            <div key={member.id} className="member-card">
                              <div className="member-info">
                                <span className="member-name">
                                  {member.name}
                                </span>
                                <span className="member-email">
                                  {member.email}
                                </span>
                                {member.generalArea && (
                                  <span className="member-area">
                                    {member.generalArea}
                                  </span>
                                )}
                              </div>
                              <div className="member-actions">
                                <div
                                  className="member-role"
                                  data-role={
                                    group.createdBy === member.id
                                      ? 'owner'
                                      : 'member'
                                  }
                                >
                                  {group.createdBy === member.id
                                    ? 'Owner'
                                    : 'Member'}
                                </div>
                                {/* Show remove button if current user is owner and this isn't the owner */}
                                {group.createdBy === user?.id &&
                                  member.id !== user?.id && (
                                    <button
                                      className="btn-danger btn-small"
                                      onClick={() =>
                                        handleRemoveMember(
                                          group.id,
                                          member.id,
                                          member.name
                                        )
                                      }
                                      disabled={removingMember === member.id}
                                      style={{
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        marginLeft: '0.5rem',
                                      }}
                                    >
                                      {removingMember === member.id
                                        ? 'Removing...'
                                        : 'Remove'}
                                    </button>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="members-actions">
                          <button
                            className="btn-secondary btn-small"
                            onClick={handleCloseMembersList}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Invite section */}
                  {invitingGroupId === group.id ? (
                    <div className="invite-form">
                      <h4>Invite Member</h4>
                      <div className="form-group">
                        <label htmlFor={`inviteEmail-${group.id}`}>
                          Email address *
                        </label>
                        <input
                          type="email"
                          id={`inviteEmail-${group.id}`}
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="friend@example.com"
                          autoFocus
                        />
                      </div>

                      {inviteError && (
                        <div
                          className="error-message"
                          style={{
                            background: '#ffebee',
                            color: '#c62828',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #ffcdd2',
                            fontSize: '0.9rem',
                            marginBottom: '1rem',
                          }}
                        >
                          {inviteError}
                        </div>
                      )}

                      <div className="form-actions">
                        <button
                          type="button"
                          className="btn-secondary btn-small"
                          onClick={handleCancelInvite}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn-primary btn-small"
                          onClick={() => handleInviteMember(group.id)}
                        >
                          Create Invite
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group-actions">
                      <button
                        className="btn-secondary btn-small"
                        onClick={() => handleViewMembers(group.id)}
                        disabled={loadingMembers === group.id}
                      >
                        {loadingMembers === group.id
                          ? 'Loading...'
                          : viewingMembersGroupId === group.id
                            ? 'Hide Members'
                            : 'View Members'}
                      </button>
                      <button
                        className="btn-primary btn-small"
                        onClick={() => handleStartInvite(group.id)}
                      >
                        Invite Members
                      </button>
                      <button
                        className="btn-danger btn-small"
                        onClick={() => handleLeaveGroup(group.id)}
                        disabled={leavingGroup === group.id}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                        }}
                      >
                        {leavingGroup === group.id
                          ? 'Leaving...'
                          : 'Leave Group'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupsPage;
