// HTTP API service for real backend communication
import type {
  User,
  Group,
  Request,
  Invite,
  PendingInvitation,
  PendingOutgoingInvitation,
  AuthResponse,
  CreateRequestForm,
  UserProfileForm,
  UserLimits,
  UserCounts,
  UserLimitsWithCounts,
  AdminMetrics,
  EmailPreferences,
  EmailPreferencesForm,
} from '../types';
import type { ApiService } from './index';

const API_BASE_URL = 'http://localhost:3002/api';

class HttpError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

export class HttpApiService implements ApiService {
  private sessionToken: string | null = null;

  constructor() {
    // Try to restore session from localStorage
    this.sessionToken = localStorage.getItem('session-token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    // Add authorization header if we have a session token
    if (this.sessionToken) {
      headers.Authorization = `Bearer ${this.sessionToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If JSON parsing fails, use default message
      }
      throw new HttpError(response.status, errorMessage);
    }

    return response.json();
  }

  private setSessionToken(token: string | null): void {
    this.sessionToken = token;
    if (token) {
      localStorage.setItem('session-token', token);
    } else {
      localStorage.removeItem('session-token');
    }
  }

  // Auth services
  async signUp(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setSessionToken(response.session);
    return response;
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setSessionToken(response.session);
    return response;
  }

  async signOut(): Promise<void> {
    try {
      await this.request('/auth/signout', { method: 'POST' });
    } finally {
      // Always clear the session token, even if the request fails
      this.setSessionToken(null);
    }
  }

  async resetPassword(email: string): Promise<void> {
    await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async updatePassword(password: string): Promise<void> {
    await this.request('/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async resendConfirmationEmail(email: string): Promise<void> {
    await this.request('/auth/resend-confirmation', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyEmailToken(tokenHash: string): Promise<void> {
    await this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token_hash: tokenHash }),
    });
  }

  // User services
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/user/current');
  }

  async getUserById(userId: string): Promise<User> {
    return this.request<User>(`/user/${userId}`);
  }

  async getUsersByIds(userIds: string[]): Promise<User[]> {
    return this.request<User[]>('/users/batch', {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  }

  async updateUserProfile(profile: UserProfileForm): Promise<User> {
    return this.request<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  // Group services
  async createGroup(name: string): Promise<Group> {
    return this.request<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getUserGroups(): Promise<Group[]> {
    return this.request<Group[]>('/groups');
  }

  async joinGroup(token: string): Promise<Group> {
    return this.request<Group>(`/invites/${token}/join`, {
      method: 'POST',
    });
  }

  async leaveGroup(groupId: string): Promise<void> {
    return this.request(`/groups/${groupId}/leave`, {
      method: 'POST',
    });
  }

  async getGroupMembers(groupId: string): Promise<User[]> {
    return this.request<User[]>(`/groups/${groupId}/members`);
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    return this.request(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Request services
  async createRequest(request: CreateRequestForm): Promise<Request> {
    // Map frontend field names to server field names
    const serverRequest = {
      itemDescription: request.itemDescription,
      storePreference: request.storePreference,
      neededBy: request.neededBy,
      pickupNotes: request.pickupNotes,
      groupId: request.groupId,
    };

    return this.request<Request>('/requests', {
      method: 'POST',
      body: JSON.stringify(serverRequest),
    });
  }

  async getUserRequests(): Promise<Request[]> {
    return this.request<Request[]>('/user/requests');
  }

  async getGroupRequests(groupId: string): Promise<Request[]> {
    return this.request<Request[]>(`/groups/${groupId}/requests`);
  }

  async claimRequest(requestId: string): Promise<Request> {
    return this.request<Request>(`/requests/${requestId}/claim`, {
      method: 'POST',
    });
  }

  async unclaimRequest(requestId: string): Promise<Request> {
    return this.request<Request>(`/requests/${requestId}/unclaim`, {
      method: 'POST',
    });
  }

  async fulfillRequest(requestId: string): Promise<Request> {
    return this.request<Request>(`/requests/${requestId}/fulfill`, {
      method: 'POST',
    });
  }

  async deleteRequest(requestId: string): Promise<void> {
    return this.request(`/requests/${requestId}`, {
      method: 'DELETE',
    });
  }

  // Invite services
  async createInvite(groupId: string, email: string): Promise<Invite> {
    return this.request<Invite>('/invites', {
      method: 'POST',
      body: JSON.stringify({ groupId, email }),
    });
  }

  async validateInvite(
    token: string
  ): Promise<{ group: Group; invite: Invite }> {
    return this.request<{ group: Group; invite: Invite }>(
      `/invites/validate/${token}`
    );
  }

  // User limits services
  async getUserLimits(): Promise<UserLimits> {
    return this.request<UserLimits>('/user/limits');
  }

  async getUserCounts(): Promise<UserCounts> {
    return this.request<UserCounts>('/user/counts');
  }

  async getUserLimitsWithCounts(): Promise<UserLimitsWithCounts> {
    return this.request<UserLimitsWithCounts>('/user/limits-with-counts');
  }

  async updateUserLimits(limits: Partial<UserLimits>): Promise<UserLimits> {
    return this.request<UserLimits>('/user/limits', {
      method: 'PUT',
      body: JSON.stringify(limits),
    });
  }

  async canCreateRequest(): Promise<boolean> {
    const response = await this.request<{ canCreate: boolean }>(
      '/user/can-create-request'
    );
    return response.canCreate;
  }

  async canCreateGroup(): Promise<boolean> {
    const response = await this.request<{ canCreate: boolean }>(
      '/user/can-create-group'
    );
    return response.canCreate;
  }

  async canJoinGroup(): Promise<boolean> {
    const response = await this.request<{ canJoin: boolean }>(
      '/user/can-join-group'
    );
    return response.canJoin;
  }

  async getAdminMetrics(): Promise<AdminMetrics> {
    return this.request<AdminMetrics>('/admin/metrics');
  }

  // Email preferences services
  async getEmailPreferences(): Promise<EmailPreferences> {
    return this.request<EmailPreferences>('/user/email-preferences');
  }

  async updateEmailPreferences(
    preferences: EmailPreferencesForm
  ): Promise<EmailPreferences> {
    return this.request<EmailPreferences>('/user/email-preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async sendImmediateNotification(requestId: string): Promise<void> {
    await this.request<void>(`/requests/${requestId}/notify`, {
      method: 'POST',
    });
  }

  async getPendingInvitations(): Promise<PendingInvitation[]> {
    return this.request<PendingInvitation[]>('/invitations/pending');
  }

  async getPendingOutgoingInvitations(): Promise<PendingOutgoingInvitation[]> {
    return this.request<PendingOutgoingInvitation[]>('/invitations/outgoing');
  }

  async getInvitationCount(): Promise<{ current: number; max: number }> {
    return this.request<{ current: number; max: number }>('/invitations/count');
  }

  async acceptInvitation(token: string): Promise<Group> {
    return this.request<Group>(`/invitations/${token}/accept`, {
      method: 'POST',
    });
  }

  async declineInvitation(token: string): Promise<void> {
    await this.request<void>(`/invitations/${token}/decline`, {
      method: 'POST',
    });
  }
}
