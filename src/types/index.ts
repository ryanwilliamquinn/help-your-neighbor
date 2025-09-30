// Core domain types for A Cup of Sugar application

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  generalArea: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  joinedAt: Date;
}

export interface Request {
  id: string;
  userId: string;
  groupId: string;
  itemDescription: string;
  storePreference?: string;
  neededBy: Date;
  pickupNotes?: string;
  status: RequestStatus;
  claimedBy?: string;
  claimedAt?: Date;
  fulfilledAt?: Date;
  createdAt: Date;
  // User data directly embedded in request objects
  creator?: User;
  helper?: User;
}

export interface Invite {
  id: string;
  groupId: string;
  email: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export interface PendingInvitation {
  id: string;
  groupId: string;
  groupName: string;
  inviterName: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface PendingOutgoingInvitation {
  id: string;
  groupId: string;
  groupName: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt: Date | null;
}

export const RequestStatus = {
  OPEN: 'open',
  CLAIMED: 'claimed',
  FULFILLED: 'fulfilled',
  EXPIRED: 'expired',
} as const;

export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface AuthResponse {
  user: User;
  session: string | null;
  emailConfirmationRequired?: boolean;
}

// Form types
export interface CreateRequestForm {
  itemDescription: string;
  storePreference?: string;
  neededBy: string;
  pickupNotes?: string;
  groupId: string;
}

export interface CreateGroupForm {
  name: string;
}

export interface UserProfileForm {
  name: string;
  phone: string;
  generalArea: string;
}

// User limits configuration
export interface UserLimits {
  userId: string;
  maxOpenRequests: number;
  maxGroupsCreated: number;
  maxGroupsJoined: number;
  createdAt: Date;
  updatedAt: Date;
}

// User usage counts
export interface UserCounts {
  openRequestsCount: number;
  groupsCreatedCount: number;
  groupsJoinedCount: number;
}

// Combined user limits and counts for UI display
export interface UserLimitsWithCounts {
  limits: UserLimits;
  counts: UserCounts;
}

// Admin metrics
export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number; // logged in last 30 days
  totalGroups: number;
  totalRequestsThisMonth: number;
  fulfillmentRate: number; // percentage of requests claimed + fulfilled
  averageTimeToClaimHours: number;
  averageGroupSize: number;
}

// Email preferences
export interface EmailPreferences {
  userId: string;
  frequency: 'disabled' | 'daily' | 'immediate';
  lastDailySent?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailPreferencesForm {
  frequency: 'disabled' | 'daily' | 'immediate';
}

export interface EmailDigest {
  user: User;
  openRequests: Request[];
  dashboardUrl: string;
}

export interface EmailSendLog {
  id: string;
  userId: string;
  emailType: string;
  requestIds: string[];
  sentAt: Date;
  emailProviderId?: string;
}
