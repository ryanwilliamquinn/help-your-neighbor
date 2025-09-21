import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { apiService } from '@/services';
import './InvitePage.css';

const InvitePage = (): React.JSX.Element => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [groupName, setGroupName] = useState('');

  const token = searchParams.get('token');

  const validateInvitation = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('Validating invite token:', token);
      const { group } = await apiService.validateInvite(token!);
      console.log('Invite validation successful, group:', group);
      setGroupName(group.name);
      setError(null);
    } catch (error) {
      console.error('Invite validation failed:', error);
      setError('This invitation link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    if (!authLoading && user) {
      // User is logged in, we can process the invitation
      validateInvitation();
    } else if (!authLoading && !user) {
      // User is not logged in, show them they need to log in first
      setLoading(false);
    }
  }, [token, user, authLoading, validateInvitation]);

  const handleJoinGroup = async (): Promise<void> => {
    if (!token) return;

    try {
      setJoining(true);
      setError(null);
      await apiService.joinGroup(token);
      setSuccess(true);
    } catch {
      setError('Failed to join group. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleGoToDashboard = (): void => {
    navigate('/');
  };

  const handleGoToLogin = (): void => {
    navigate(
      `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
    );
  };

  if (!token) {
    return (
      <div className="invite-page">
        <div className="invite-container">
          <div className="invite-error">
            <h1>Invalid Invitation</h1>
            <p>This invitation link is not valid.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="invite-page">
        <div className="invite-container">
          <div className="invite-loading">
            <h2>Loading invitation...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="invite-page">
        <div className="invite-container">
          <div className="invite-login-required">
            <h1>Join a Group</h1>
            <p>You need to log in or create an account to join this group.</p>
            <div className="invite-actions">
              <button className="btn-primary" onClick={handleGoToLogin}>
                Log In / Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invite-page">
        <div className="invite-container">
          <div className="invite-error">
            <h1>Invitation Error</h1>
            <p>{error}</p>
            <button className="btn-primary" onClick={handleGoToDashboard}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="invite-page">
        <div className="invite-container">
          <div className="invite-success">
            <h1>Welcome to {groupName}!</h1>
            <p>
              You've successfully joined the group. You can now see requests
              from other members and post your own.
            </p>
            <div className="invite-actions">
              <button className="btn-primary" onClick={handleGoToDashboard}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-page">
      <div className="invite-container">
        <div className="invite-join">
          <h1>Join Group</h1>
          <div className="group-info">
            <h2>{groupName}</h2>
            <p>
              You've been invited to join this group. Members help each other
              with pickup requests and errands.
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="invite-actions">
            <button
              className="btn-secondary"
              onClick={handleGoToDashboard}
              disabled={joining}
            >
              Not now
            </button>
            <button
              className="btn-primary"
              onClick={handleJoinGroup}
              disabled={joining}
            >
              {joining ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
