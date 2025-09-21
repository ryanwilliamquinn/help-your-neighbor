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
} from '../types';

export interface ApiService {
  // Auth services
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;

  // User services
  getCurrentUser: () => Promise<User>;
  getUserById: (userId: string) => Promise<User>;
  updateUserProfile: (profile: UserProfileForm) => Promise<User>;

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
  fulfillRequest: (requestId: string) => Promise<Request>;
  deleteRequest: (requestId: string) => Promise<void>;

  // Invite services
  createInvite: (groupId: string, email: string) => Promise<Invite>;
  validateInvite: (token: string) => Promise<{ group: Group; invite: Invite }>;
}

import { MockApiService } from './mockApiService';
import { HttpApiService } from './httpApiService';

// Service factory - chooses between mock and HTTP API based on environment
function createApiService(): ApiService {
  // Check for test environment first (NODE_ENV is set by Jest)
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    // Test environment - use mock API with in-memory storage
    return new MockApiService();
  }

  // For development, use HTTP API to connect to the backend server
  if (typeof window !== 'undefined') {
    // Browser environment - use HTTP API
    return new HttpApiService();
  } else {
    // SSR fallback - use mock API
    return new MockApiService();
  }
}

// Export singleton instance
export const apiService: ApiService = createApiService();
