import { createContext } from 'react';
import type { User, UserProfileForm } from '../types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateUserProfile?: (profile: UserProfileForm) => Promise<User>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
