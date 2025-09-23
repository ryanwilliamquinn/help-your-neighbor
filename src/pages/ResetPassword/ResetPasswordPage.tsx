import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const toast = useToast();
  const navigate = useNavigate();

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
            toast.error('Invalid or expired reset link');
          }
        } catch (error) {
          toast.error('Error validating reset link');
        }
      } else {
        toast.error('Invalid reset link');
      }
    };

    checkToken();
  }, [toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(password);
      setIsSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
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
          <p>Redirecting to dashboard...</p>
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