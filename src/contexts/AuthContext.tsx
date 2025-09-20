import React, { createContext } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // This will be implemented when we set up Supabase
  const value: AuthContextType = {
    user: null,
    loading: false,
    signIn: async () => {
      throw new Error('Not implemented');
    },
    signUp: async () => {
      throw new Error('Not implemented');
    },
    signOut: async () => {
      throw new Error('Not implemented');
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
