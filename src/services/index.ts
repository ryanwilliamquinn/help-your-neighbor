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
  updateUserProfile: (profile: UserProfileForm) => Promise<User>;

  // Group services
  createGroup: (name: string) => Promise<Group>;
  joinGroup: (token: string) => Promise<Group>;
  getGroupMembers: (groupId: string) => Promise<User[]>;

  // Request services
  createRequest: (request: CreateRequestForm) => Promise<Request>;
  getGroupRequests: (groupId: string) => Promise<Request[]>;
  claimRequest: (requestId: string) => Promise<Request>;
  fulfillRequest: (requestId: string) => Promise<Request>;

  // Invite services
  createInvite: (groupId: string, email: string) => Promise<Invite>;
}

// Placeholder implementation - will be replaced with Supabase
export const apiService: ApiService = {
  signUp: async () => {
    throw new Error('Not implemented');
  },
  signIn: async () => {
    throw new Error('Not implemented');
  },
  signOut: async () => {
    throw new Error('Not implemented');
  },
  getCurrentUser: async () => {
    throw new Error('Not implemented');
  },
  updateUserProfile: async () => {
    throw new Error('Not implemented');
  },
  createGroup: async () => {
    throw new Error('Not implemented');
  },
  joinGroup: async () => {
    throw new Error('Not implemented');
  },
  getGroupMembers: async () => {
    throw new Error('Not implemented');
  },
  createRequest: async () => {
    throw new Error('Not implemented');
  },
  getGroupRequests: async () => {
    throw new Error('Not implemented');
  },
  claimRequest: async () => {
    throw new Error('Not implemented');
  },
  fulfillRequest: async () => {
    throw new Error('Not implemented');
  },
  createInvite: async () => {
    throw new Error('Not implemented');
  },
};
