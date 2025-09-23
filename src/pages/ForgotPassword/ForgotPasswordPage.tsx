import React, { useState } from 'react';
import { useAuth } from '@/hooks';
import { useToast } from '@/hooks/useToast';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = (): React.JSX.Element => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      setIsSubmitted(true);
      showToast('Password reset email sent!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to send reset email', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="forgot-password-page">
        <div className="forgot-password-success">
          <h1>Check Your Email</h1>
          <p>
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p>
            Click the link in your email to reset your password. The link will expire in 24 hours.
          </p>
          <a href="/login">← Back to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <h1>Reset Your Password</h1>
      <p>Enter your email address and we'll send you a link to reset your password.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="forgot-password-links">
        <a href="/login">← Back to Login</a>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;