import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { useToast } from '@/hooks/useToast';

interface LocationState {
  email?: string;
  userEmail?: string;
}

const EmailVerificationPage = (): React.JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [isResending, setIsResending] = useState(false);

  const state = location.state as LocationState;
  const email = state?.email || state?.userEmail || '';

  const handleResendEmail = async (): Promise<void> => {
    if (!email) {
      toast.error('No email address found. Please try signing up again.');
      return;
    }

    setIsResending(true);
    try {
      const { apiService } = await import('../../services');
      await apiService.resendConfirmationEmail(email);
      toast.success('Confirmation email sent! Please check your inbox.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to resend email'
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = (): void => {
    navigate('/login');
  };

  return (
    <div className="login-page">
      <div className="email-verification-container">
        <h1>Check Your Email</h1>

        <div className="verification-content">
          <div className="email-icon">📧</div>

          <p className="verification-message">
            We've sent a confirmation link to:
          </p>

          <p className="email-display">
            <strong>{email || 'your email address'}</strong>
          </p>

          <p className="verification-instructions">
            Click the link in the email to activate your account. If you don't
            see the email, check your spam folder.
          </p>

          <div className="verification-actions">
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={isResending || !email}
              className="resend-button"
            >
              {isResending ? 'Sending...' : 'Resend Email'}
            </button>

            <button
              type="button"
              onClick={handleGoToLogin}
              className="login-button"
            >
              Go to Login
            </button>
          </div>

          <div className="help-text">
            <p>
              <strong>Already confirmed your email?</strong> Try logging in with
              your credentials.
            </p>
            <p>
              <strong>Still having trouble?</strong> Make sure you're clicking
              the most recent confirmation email we sent you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
