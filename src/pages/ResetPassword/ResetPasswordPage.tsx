import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import './ResetPasswordPage.css';

const ResetPasswordPage = (): React.JSX.Element => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { updatePassword } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const checkToken = async (): Promise<void> => {
      if (!supabase) return;

      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const type = urlParams.get('type');

      if (token && type === 'recovery') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });

          if (!error) {
            setIsValidToken(true);
          } else {
            showToast('Invalid or expired reset link', 'error');
          }
        } catch (error) {
          showToast('Error validating reset link', 'error');
        }
      } else {
        showToast('Invalid reset link', 'error');
      }
    };

    checkToken();
  }, [showToast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!password || !confirmPassword) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(password);
      setIsSuccess(true);
      showToast('Password updated successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-error">
          <h1>Invalid Reset Link</h1>
          <p>This password reset link is invalid or has expired.</p>
          <a href="/forgot-password">Request a new reset link</a>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-success">
          <h1>Password Updated!</h1>
          <p>Your password has been successfully updated.</p>
          <a href="/login">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <h1>Set New Password</h1>
      <p>Enter your new password below.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password">New Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;