import React from 'react';
import type { ReactNode } from 'react';
import type { User, UserProfileForm } from '../types';
import { AuthContext, type AuthContextType } from './AuthContextDefinition';

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Check for existing session on mount
  React.useEffect(() => {
    const checkSession = async (): Promise<void> => {
      try {
        const { apiService } = await import('../services');
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
      } catch {
        // No current user or error - that's fine
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const { apiService } = await import('../services');
      const response = await apiService.signIn(email, password);
      setUser(response.user);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const { apiService } = await import('../services');
      const response = await apiService.signUp(email, password);

      // Only set user if they have a valid session (email confirmed)
      // If email confirmation is required, leave user as null
      if (response.session && !response.emailConfirmationRequired) {
        setUser(response.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      const { apiService } = await import('../services');
      await apiService.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    const { apiService } = await import('../services');
    await apiService.resetPassword(email);
  };

  const updatePassword = async (password: string): Promise<void> => {
    const { apiService } = await import('../services');
    await apiService.updatePassword(password);
  };

  const updateUserProfile = async (profile: UserProfileForm): Promise<User> => {
    setLoading(true);
    try {
      const { apiService } = await import('../services');
      const updatedUser = await apiService.updateUserProfile(profile);
      setUser(updatedUser);
      return updatedUser;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
