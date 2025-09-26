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

  // Check for existing session - reusable function
  const checkSession = React.useCallback(async (): Promise<void> => {
    try {
      const { apiService } = await import('../services');
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
    } catch {
      // No current user or error - that's fine
      setUser(null);
    }
  }, []);

  // Set up Supabase auth listener and initial session check
  React.useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async (): Promise<void> => {
      setLoading(true);

      // Initial session check
      await checkSession();

      // Set up auth state listener for automatic updates
      const { supabase } = await import('../lib/supabase');
      if (supabase) {
        const { data } = supabase.auth.onAuthStateChange(async (event) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await checkSession();
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        });
        subscription = data.subscription;
      }

      setLoading(false);
    };

    initializeAuth();

    // Cleanup function
    return (): void => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [checkSession]);

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

  const refreshAuth = async (): Promise<void> => {
    await checkSession();
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
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
