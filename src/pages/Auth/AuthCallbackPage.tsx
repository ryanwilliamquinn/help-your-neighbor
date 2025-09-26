import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks';

const AuthCallbackPage = (): React.JSX.Element => {
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshAuth, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  // Debug: Log that component is mounting
  console.log('AuthCallbackPage mounted with URL:', window.location.href);

  useEffect(() => {
    const handleAuthCallback = async (): Promise<void> => {
      try {
        const { apiService } = await import('../../services');

        // Get the URL params
        const urlParams = new URLSearchParams(window.location.search);
        const tokenHash = urlParams.get('token_hash');
        const type = urlParams.get('type');

        console.log('URL params:', {
          tokenHash,
          type,
          url: window.location.href,
        });

        if (!tokenHash || !type) {
          throw new Error('Invalid authentication link');
        }

        if (type === 'signup') {
          // Handle email confirmation
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
        console.error('Auth callback error:', error);

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

    if (isProcessing) {
      handleAuthCallback();
    }
  }, [navigate, toast, refreshAuth, isProcessing]);

  // Redirect to dashboard once user is authenticated
  useEffect(() => {
    if (!isProcessing && user) {
      console.log('User authenticated, redirecting to dashboard:', user.email);
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
