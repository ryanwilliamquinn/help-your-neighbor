import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks';

const AuthCallbackPage = (): React.JSX.Element => {
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshAuth, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async (): Promise<void> => {
      try {
        // Get the URL params
        const urlParams = new URLSearchParams(window.location.search);
        const tokenHash = urlParams.get('token_hash');
        const type = urlParams.get('type');

        if (!tokenHash || !type) {
          throw new Error('Invalid authentication link');
        }

        if (type === 'signup') {
          // Check if user is already authenticated (from auth state listener)
          if (user) {
            toast.success(
              'Email confirmed successfully! You are now logged in.'
            );
            setIsProcessing(false);
            return;
          }

          // Handle email confirmation manually if not already authenticated
          const { apiService } = await import('../../services');
          await apiService.verifyEmailToken(tokenHash);

          // Refresh auth state to get the authenticated user
          await refreshAuth();

          toast.success('Email confirmed successfully! You are now logged in.');
          setIsProcessing(false);
        } else if (type === 'recovery') {
          // Handle password reset
          navigate(`/reset-password?token=${tokenHash}`);
          setIsProcessing(false);
        } else {
          throw new Error('Unknown authentication type');
        }
      } catch (error) {
        // Handle specific error cases
        if (error instanceof Error) {
          if (
            error.message.includes('invalid') ||
            error.message.includes('expired')
          ) {
            toast.error(
              'Email verification link has expired. Please sign up again or request a new confirmation email.'
            );
            navigate('/signup');
          } else {
            toast.error(error.message);
            navigate('/login');
          }
        } else {
          toast.error('Authentication failed');
          navigate('/login');
        }
        setIsProcessing(false);
      }
    };

    if (isProcessing && !hasAttempted) {
      setHasAttempted(true);
      handleAuthCallback();
    }
  }, [navigate, toast, refreshAuth, isProcessing, hasAttempted, user]);

  // Redirect to dashboard once user is authenticated
  useEffect(() => {
    if (!isProcessing && user) {
      navigate('/');
    }
  }, [user, isProcessing, navigate]);

  return (
    <div className="login-page">
      <div className="auth-callback-container">
        <h1>Confirming your account...</h1>
        <p>Please wait while we verify your email.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
