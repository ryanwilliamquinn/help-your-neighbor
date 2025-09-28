// Service layer for API interactions
// This will be implemented when we set up Supabase

import type {
  User,
  Group,
  Request,
  Invite,
  AuthResponse,
  CreateRequestForm,
  UserProfileForm,
  UserLimits,
  UserCounts,
  UserLimitsWithCounts,
  AdminMetrics,
} from '../types';

export interface ApiService {
  // Auth services
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  verifyEmailToken: (tokenHash: string) => Promise<void>;

  // User services
  getCurrentUser: () => Promise<User>;
  getUserById: (userId: string) => Promise<User>;
  getUsersByIds: (userIds: string[]) => Promise<User[]>;
  updateUserProfile: (profile: UserProfileForm) => Promise<User>;

  // User limits services
  getUserLimits: () => Promise<UserLimits>;
  getUserCounts: () => Promise<UserCounts>;
  getUserLimitsWithCounts: () => Promise<UserLimitsWithCounts>;
  updateUserLimits: (limits: Partial<UserLimits>) => Promise<UserLimits>;
  canCreateRequest: () => Promise<boolean>;
  canCreateGroup: () => Promise<boolean>;
  canJoinGroup: () => Promise<boolean>;

  // Group services
  createGroup: (name: string) => Promise<Group>;
  getUserGroups: () => Promise<Group[]>;
  joinGroup: (token: string) => Promise<Group>;
  leaveGroup: (groupId: string) => Promise<void>;
  getGroupMembers: (groupId: string) => Promise<User[]>;
  removeGroupMember: (groupId: string, userId: string) => Promise<void>;

  // Request services
  createRequest: (request: CreateRequestForm) => Promise<Request>;
  getUserRequests: () => Promise<Request[]>;
  getGroupRequests: (groupId: string) => Promise<Request[]>;
  claimRequest: (requestId: string) => Promise<Request>;
  unclaimRequest: (requestId: string) => Promise<Request>;
  fulfillRequest: (requestId: string) => Promise<Request>;
  deleteRequest: (requestId: string) => Promise<void>;

  // Invite services
  createInvite: (groupId: string, email: string) => Promise<Invite>;
  validateInvite: (token: string) => Promise<{ group: Group; invite: Invite }>;

  // Admin services
  getAdminMetrics: () => Promise<AdminMetrics>;
}

import { MockApiService } from './mockApiService';
import { HttpApiService } from './httpApiService';
import { SupabaseApiService } from './supabaseApiService';

// Helper function to safely access Vite environment variables
const getViteEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return key === 'VITE_USE_MOCK_API' ? 'true' : undefined;
  }
  if (typeof window !== 'undefined') {
    try {
      const importMeta = new Function('return import.meta')();
      return importMeta?.env?.[key];
    } catch {
      // Don't force mock API in production - only in test environment
      return undefined;
    }
  }
  return undefined;
};

// Service factory - chooses between mock, HTTP, and Supabase API based on environment
function createApiService(): ApiService {
  // Check for test environment first (NODE_ENV is set by Jest)
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    // Test environment - use mock API with in-memory storage
    return new MockApiService();
  }

  // Check if we should use mock API (development override)
  if (typeof window !== 'undefined') {
    // Access environment variables safely for browser environment
    try {
      // Check for mock API override first
      if (getViteEnv('VITE_USE_MOCK_API') === 'true') {
        return new MockApiService();
      }

      // Check if Supabase is configured - prioritize Supabase for production
      if (
        getViteEnv('VITE_SUPABASE_URL') &&
        getViteEnv('VITE_SUPABASE_ANON_KEY')
      ) {
        return new SupabaseApiService();
      }

      // Fallback to HTTP API for local development
      return new HttpApiService();
    } catch {
      // If we can't access env vars but have Supabase configured, try Supabase
      return new SupabaseApiService();
    }
  } else {
    // SSR fallback - use mock API
    return new MockApiService();
  }
}

// Export singleton instance
export const apiService: ApiService = createApiService();
