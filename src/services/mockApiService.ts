// Mock API service using localStorage for offline development

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
  RequestStatus,
  UserLimits,
  UserCounts,
  UserLimitsWithCounts,
  AdminMetrics,
  EmailPreferences,
  EmailPreferencesForm,
} from '../types';
import type { ApiService } from './index';
import { StorageFactory, type StorageAdapter } from '../lib/storage';
import {
  validateEmail,
  validatePhone,
  generateToken,
  sanitizeInput,
} from '../utils';

// Simple password hashing for mock API (for demo purposes only)
// In production, use bcrypt or similar
function hashPassword(password: string): string {
  // This is a simple hash for mock purposes only
  // Real implementation should use bcrypt
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export class MockApiService implements ApiService {
  private db!: StorageAdapter;
  private currentUser: User | null = null;
  private passwordHashes: Map<string, string> = new Map(); // userId -> passwordHash

  constructor(storage?: StorageAdapter) {
    if (storage) {
      // Use provided storage (for testing)
      this.db = storage;
      this.currentUser = this.db.getCurrentUser();
      this.initializeSampleData();
    } else {
      // Initialize storage asynchronously - file storage in dev, in-memory for tests
      this.initializeStorage();
    }
  }

  private async initializeStorage(): Promise<void> {
    this.db = await StorageFactory.getStorage();
    this.currentUser = this.db.getCurrentUser();
    this.initializeSampleData();
  }

  // Ensure storage is initialized before any API call
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initializeStorage();
    }
  }

  // Simulate network delay for realistic testing
  private async delay(ms: number = 100): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Initialize with some sample data for development
  private initializeSampleData(): void {
    const users = this.db.getUsers();
    if (users.length === 0) {
      // Add sample users for testing
      const sampleUsers: User[] = [
        {
          id: this.db.generateId(),
          email: 'alice@example.com',
          name: 'Alice Johnson',
          phone: '555-0101',
          generalArea: 'Downtown',
          isAdmin: true,
          createdAt: new Date(),
        },
        {
          id: this.db.generateId(),
          email: 'bob@example.com',
          name: 'Bob Smith',
          phone: '555-0102',
          generalArea: 'Midtown',
          isAdmin: false,
          createdAt: new Date(),
        },
      ];

      // Set default passwords for sample users (password123)
      sampleUsers.forEach((user) => {
        this.passwordHashes.set(user.id, hashPassword('password123'));
      });

      this.db.setUsers(sampleUsers);
    }
  }

  // Auth services
  async signUp(email: string, password: string): Promise<AuthResponse> {
    await this.ensureInitialized();
    await this.delay();

    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const users = this.db.getUsers();
    const existingUser = users.find((u) => u.email === email);

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const newUser: User = {
      id: this.db.generateId(),
      email,
      name: '', // Will be filled in profile setup
      phone: '',
      generalArea: '',
      isAdmin: false,
      createdAt: new Date(),
    };

    // Store password hash securely
    this.passwordHashes.set(newUser.id, hashPassword(password));

    users.push(newUser);
    this.db.setUsers(users);

    this.currentUser = newUser;
    this.db.setCurrentUser(newUser);

    return {
      user: newUser,
      session: 'mock-session-token',
    };
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    await this.ensureInitialized();
    await this.delay();

    if (!password || password.length === 0) {
      throw new Error('Password is required');
    }

    const users = this.db.getUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Validate password against stored hash
    const storedHash = this.passwordHashes.get(user.id);
    if (!storedHash || !verifyPassword(password, storedHash)) {
      throw new Error('Invalid email or password');
    }

    this.currentUser = user;
    this.db.setCurrentUser(user);

    return {
      user,
      session: 'mock-session-token',
    };
  }

  async signOut(): Promise<void> {
    await this.ensureInitialized();
    await this.delay();
    this.currentUser = null;
    this.db.setCurrentUser(null);
  }

  async resetPassword(): Promise<void> {
    await this.ensureInitialized();
    await this.delay();
    // Mock: Password reset email sent
  }

  async updatePassword(): Promise<void> {
    await this.ensureInitialized();
    await this.delay();
    // Mock: Password updated successfully
  }

  async resendConfirmationEmail(): Promise<void> {
    await this.ensureInitialized();
    await this.delay();
    // Mock: Confirmation email sent
  }

  async verifyEmailToken(): Promise<void> {
    await this.ensureInitialized();
    await this.delay();
    // Mock: Email token verified
  }

  // User services
  async getCurrentUser(): Promise<User> {
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    return this.currentUser;
  }

  async getUserById(userId: string): Promise<User> {
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const users = this.db.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async getUsersByIds(userIds: string[]): Promise<User[]> {
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const users = this.db.getUsers();
    return users.filter((user) => userIds.includes(user.id));
  }

  async updateUserProfile(profile: UserProfileForm): Promise<User> {
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (!validatePhone(profile.phone)) {
      throw new Error('Invalid phone number format');
    }

    const users = this.db.getUsers();
    const userIndex = users.findIndex((u) => u.id === this.currentUser!.id);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const updatedUser: User = {
      ...this.currentUser,
      name: sanitizeInput(profile.name.trim()),
      phone: sanitizeInput(profile.phone.trim()),
      generalArea: sanitizeInput(profile.generalArea.trim()),
    };

    users[userIndex] = updatedUser;
    this.db.setUsers(users);

    this.currentUser = updatedUser;
    this.db.setCurrentUser(updatedUser);

    return updatedUser;
  }

  // Group services
  async createGroup(name: string): Promise<Group> {
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    // Check if user can create more groups
    const canCreate = await this.canCreateGroup();
    if (!canCreate) {
      const { limits, counts } = await this.getUserLimitsWithCounts();
      throw new Error(
        `You have reached your limit of ${limits.maxGroupsCreated} groups. You currently have ${counts.groupsCreatedCount} groups.`
      );
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Group name is required');
    }

    const sanitizedName = sanitizeInput(trimmedName);
    if (!sanitizedName) {
      throw new Error('Group name contains invalid characters');
    }

    const newGroup: Group = {
      id: this.db.generateId(),
      name: sanitizedName,
      createdBy: this.currentUser.id,
      createdAt: new Date(),
    };

    const groups = this.db.getGroups();
    groups.push(newGroup);
    this.db.setGroups(groups);

    // Automatically add creator as group member
    const groupMembers = this.db.getGroupMembers();
    groupMembers.push({
      groupId: newGroup.id,
      userId: this.currentUser.id,
      joinedAt: new Date(),
    });
    this.db.setGroupMembers(groupMembers);

    return newGroup;
  }

  async getUserGroups(): Promise<Group[]> {
    await this.delay();
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }
    const allGroups = this.db.getGroups();
    const groupMembers = this.db.getGroupMembers();

    // Find groups where the current user is a member
    const userGroupIds = groupMembers
      .filter((member) => member.userId === this.currentUser!.id)
      .map((member) => member.groupId);

    const groupsWithUser = allGroups.filter((group) =>
      userGroupIds.includes(group.id)
    );
    return groupsWithUser;
  }

  async joinGroup(token: string): Promise<Group> {
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    // Check if user can join more groups
    const canJoin = await this.canJoinGroup();
    if (!canJoin) {
      const { limits, counts } = await this.getUserLimitsWithCounts();
      throw new Error(
        `You have reached your limit of ${limits.maxGroupsJoined} groups. You are currently a member of ${counts.groupsJoinedCount} groups.`
      );
    }

    const invites = this.db.getInvites();
    const invite = invites.find((i) => i.token === token && !i.usedAt);

    if (!invite) {
      throw new Error('Invalid or expired invite token');
    }

    if (new Date() > invite.expiresAt) {
      throw new Error('Invite has expired');
    }

    const groups = this.db.getGroups();
    const group = groups.find((g) => g.id === invite.groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is already a member
    const groupMembers = this.db.getGroupMembers();
    const existingMembership = groupMembers.find(
      (gm) => gm.groupId === group.id && gm.userId === this.currentUser!.id
    );

    if (existingMembership) {
      throw new Error('You are already a member of this group');
    }

    // Check group size limit
    const currentMemberCount = groupMembers.filter(
      (gm) => gm.groupId === group.id
    ).length;
    if (currentMemberCount >= 20) {
      throw new Error('Group is full (maximum 20 members)');
    }

    // Add user to group
    groupMembers.push({
      groupId: group.id,
      userId: this.currentUser.id,
      joinedAt: new Date(),
    });
    this.db.setGroupMembers(groupMembers);

    // Mark invite as used
    const inviteIndex = invites.findIndex((i) => i.id === invite.id);
    invites[inviteIndex] = { ...invite, usedAt: new Date() };
    this.db.setInvites(invites);

    return group;
  }

  async validateInvite(
    token: string
  ): Promise<{ group: Group; invite: Invite }> {
    await this.ensureInitialized();
    await this.delay();

    const invites = this.db.getInvites();
    const invite = invites.find((i) => i.token === token && !i.usedAt);
    if (!invite) {
      throw new Error('Invalid or expired invite token');
    }
    if (new Date() > invite.expiresAt) {
      throw new Error('Invite has expired');
    }

    const groups = this.db.getGroups();
    const group = groups.find((g) => g.id === invite.groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    return { group, invite };
  }

  async getGroupMembers(groupId: string): Promise<User[]> {
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    // Verify user is member of this group
    const groupMembers = this.db.getGroupMembers();
    const userMembership = groupMembers.find(
      (gm) => gm.groupId === groupId && gm.userId === this.currentUser!.id
    );

    if (!userMembership) {
      throw new Error('You are not a member of this group');
    }

    const memberUserIds = groupMembers
      .filter((gm) => gm.groupId === groupId)
      .map((gm) => gm.userId);

    const users = this.db.getUsers();
    return users.filter((user) => memberUserIds.includes(user.id));
  }

  async leaveGroup(groupId: string): Promise<void> {
    await this.delay();
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    // Check if group exists
    const groups = this.db.getGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is a member
    const groupMembers = this.db.getGroupMembers();
    const membershipIndex = groupMembers.findIndex(
      (gm) => gm.groupId === groupId && gm.userId === this.currentUser!.id
    );

    if (membershipIndex === -1) {
      throw new Error('You are not a member of this group');
    }

    // Prevent group owner from leaving if there are other members
    const groupMemberCount = groupMembers.filter(
      (gm) => gm.groupId === groupId
    ).length;
    if (group.createdBy === this.currentUser.id && groupMemberCount > 1) {
      throw new Error(
        'Group owner cannot leave while other members remain. Remove other members first or transfer ownership.'
      );
    }

    // Remove membership
    groupMembers.splice(membershipIndex, 1);
    this.db.setGroupMembers(groupMembers);

    // If this was the last member and group owner, delete the group
    if (group.createdBy === this.currentUser.id && groupMemberCount === 1) {
      const groupIndex = groups.findIndex((g) => g.id === groupId);
      if (groupIndex !== -1) {
        groups.splice(groupIndex, 1);
        this.db.setGroups(groups);
      }
    }
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await this.delay();
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    // Check if group exists
    const groups = this.db.getGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Check if current user is the group owner
    if (group.createdBy !== this.currentUser.id) {
      throw new Error('Only group owners can remove members');
    }

    // Prevent owner from removing themselves
    if (userId === this.currentUser.id) {
      throw new Error('Use leave group functionality to leave the group');
    }

    // Check if target user is a member
    const groupMembers = this.db.getGroupMembers();
    const membershipIndex = groupMembers.findIndex(
      (gm) => gm.groupId === groupId && gm.userId === userId
    );

    if (membershipIndex === -1) {
      throw new Error('User is not a member of this group');
    }

    // Remove membership
    groupMembers.splice(membershipIndex, 1);
    this.db.setGroupMembers(groupMembers);
  }

  // Request services
  async createRequest(request: CreateRequestForm): Promise<Request> {
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    // Check if user can create more requests
    const canCreate = await this.canCreateRequest();
    if (!canCreate) {
      const { limits, counts } = await this.getUserLimitsWithCounts();
      throw new Error(
        `You have reached your limit of ${limits.maxOpenRequests} open requests. You currently have ${counts.openRequestsCount} open requests.`
      );
    }

    if (!request.itemDescription.trim()) {
      throw new Error('Item description is required');
    }

    const neededBy = new Date(request.neededBy);
    const now = new Date();
    // Allow a 5-second margin to account for form submission and processing time
    const marginMs = 5 * 1000;
    if (neededBy.getTime() <= now.getTime() - marginMs) {
      throw new Error('Needed by date must be in the future');
    }

    // Verify the user is a member of the specified group
    const groupMembers = this.db.getGroupMembers();
    const userMembership = groupMembers.find(
      (gm) =>
        gm.groupId === request.groupId && gm.userId === this.currentUser!.id
    );

    if (!userMembership) {
      throw new Error('You are not a member of the specified group');
    }

    const newRequest: Request = {
      id: this.db.generateId(),
      userId: this.currentUser.id,
      groupId: request.groupId,
      itemDescription: sanitizeInput(request.itemDescription.trim()),
      storePreference: request.storePreference
        ? sanitizeInput(request.storePreference.trim())
        : undefined,
      neededBy,
      pickupNotes: request.pickupNotes
        ? sanitizeInput(request.pickupNotes.trim())
        : undefined,
      status: 'open' as RequestStatus,
      createdAt: new Date(),
    };

    const requests = this.db.getRequests();
    requests.push(newRequest);
    this.db.setRequests(requests);

    return newRequest;
  }

  async getUserRequests(): Promise<Request[]> {
    await this.delay();
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const requests = this.db.getRequests();
    return requests.filter(
      (request) => request.userId === this.currentUser!.id
    );
  }

  async getGroupRequests(groupId: string): Promise<Request[]> {
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    // Verify user is member of this group
    const groupMembers = this.db.getGroupMembers();
    const userMembership = groupMembers.find(
      (gm) => gm.groupId === groupId && gm.userId === this.currentUser!.id
    );

    if (!userMembership) {
      throw new Error('You are not a member of this group');
    }

    const requests = this.db.getRequests();
    return requests
      .filter((request) => request.groupId === groupId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async claimRequest(requestId: string): Promise<Request> {
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const requests = this.db.getRequests();
    const requestIndex = requests.findIndex((r) => r.id === requestId);

    if (requestIndex === -1) {
      throw new Error('Request not found');
    }

    const request = requests[requestIndex];

    if (request.status !== 'open') {
      throw new Error('Request is not available for claiming');
    }

    if (request.userId === this.currentUser.id) {
      throw new Error('You cannot claim your own request');
    }

    // Verify user is in the same group
    const groupMembers = this.db.getGroupMembers();
    const userMembership = groupMembers.find(
      (gm) =>
        gm.groupId === request.groupId && gm.userId === this.currentUser!.id
    );

    if (!userMembership) {
      throw new Error('You are not a member of this group');
    }

    const updatedRequest: Request = {
      ...request,
      status: 'claimed' as RequestStatus,
      claimedBy: this.currentUser.id,
      claimedAt: new Date(),
    };

    requests[requestIndex] = updatedRequest;
    this.db.setRequests(requests);

    return updatedRequest;
  }

  async unclaimRequest(requestId: string): Promise<Request> {
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const requests = this.db.getRequests();
    const requestIndex = requests.findIndex((r) => r.id === requestId);

    if (requestIndex === -1) {
      throw new Error('Request not found');
    }

    const request = requests[requestIndex];

    if (request.status !== 'claimed') {
      throw new Error('Request is not claimed');
    }

    if (request.claimedBy !== this.currentUser.id) {
      throw new Error('You can only unclaim requests that you have claimed');
    }

    const updatedRequest: Request = {
      ...request,
      status: 'open' as RequestStatus,
      claimedBy: undefined,
      claimedAt: undefined,
    };

    requests[requestIndex] = updatedRequest;
    this.db.setRequests(requests);

    return updatedRequest;
  }

  async fulfillRequest(requestId: string): Promise<Request> {
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const requests = this.db.getRequests();
    const requestIndex = requests.findIndex((r) => r.id === requestId);

    if (requestIndex === -1) {
      throw new Error('Request not found');
    }

    const request = requests[requestIndex];

    if (request.status !== 'claimed') {
      throw new Error('Request is not in claimed status');
    }

    if (request.claimedBy !== this.currentUser.id) {
      throw new Error('You can only fulfill requests you have claimed');
    }

    const updatedRequest: Request = {
      ...request,
      status: 'fulfilled' as RequestStatus,
    };

    requests[requestIndex] = updatedRequest;
    this.db.setRequests(requests);

    return updatedRequest;
  }

  async deleteRequest(requestId: string): Promise<void> {
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const requests = this.db.getRequests();
    const requestIndex = requests.findIndex((r) => r.id === requestId);

    if (requestIndex === -1) {
      throw new Error('Request not found');
    }

    const request = requests[requestIndex];

    // Only allow the request creator to delete their own request
    if (request.userId !== this.currentUser.id) {
      throw new Error('You can only delete your own requests');
    }

    // Don't allow deletion if the request has been claimed or fulfilled
    if (request.status === 'fulfilled') {
      throw new Error('Cannot delete a fulfilled request');
    }

    // Remove the request from the database
    requests.splice(requestIndex, 1);
    this.db.setRequests(requests);
  }

  // Invite services
  async createInvite(groupId: string, email: string): Promise<Invite> {
    await this.ensureInitialized();
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    const groups = this.db.getGroups();
    const group = groups.find((g) => g.id === groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    if (group.createdBy !== this.currentUser.id) {
      throw new Error('Only group creators can send invites');
    }

    // Check if user is already a member
    const users = this.db.getUsers();
    const targetUser = users.find((u) => u.email === email);

    if (targetUser) {
      const groupMembers = this.db.getGroupMembers();
      const existingMembership = groupMembers.find(
        (gm) => gm.groupId === groupId && gm.userId === targetUser.id
      );

      if (existingMembership) {
        throw new Error('User is already a member of this group');
      }
    }

    const newInvite: Invite = {
      id: this.db.generateId(),
      groupId,
      email,
      token: generateToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    };

    const invites = this.db.getInvites();
    invites.push(newInvite);
    this.db.setInvites(invites);

    return newInvite;
  }

  // Default limits configuration
  private getDefaultLimits(): Omit<
    UserLimits,
    'userId' | 'createdAt' | 'updatedAt'
  > {
    return {
      maxOpenRequests: 5,
      maxGroupsCreated: 3,
      maxGroupsJoined: 5,
    };
  }

  // User limits services
  async getUserLimits(): Promise<UserLimits> {
    await this.ensureInitialized();
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    // Get or create user limits
    const userLimits = this.db.getUserLimits();
    let limits = userLimits.find((ul) => ul.userId === this.currentUser!.id);

    if (!limits) {
      // Create default limits for user
      const defaultLimits = this.getDefaultLimits();
      limits = {
        userId: this.currentUser!.id,
        ...defaultLimits,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userLimits.push(limits);
      this.db.setUserLimits(userLimits);
    }

    return limits;
  }

  async getUserCounts(): Promise<UserCounts> {
    await this.ensureInitialized();
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const requests = this.db.getRequests();
    const groups = this.db.getGroups();
    const groupMembers = this.db.getGroupMembers();

    const openRequestsCount = requests.filter(
      (r) => r.userId === this.currentUser!.id && r.status === 'open'
    ).length;

    const groupsCreatedCount = groups.filter(
      (g) => g.createdBy === this.currentUser!.id
    ).length;

    const groupsJoinedCount = groupMembers.filter(
      (gm) => gm.userId === this.currentUser!.id
    ).length;

    return {
      openRequestsCount,
      groupsCreatedCount,
      groupsJoinedCount,
    };
  }

  async getUserLimitsWithCounts(): Promise<UserLimitsWithCounts> {
    const [limits, counts] = await Promise.all([
      this.getUserLimits(),
      this.getUserCounts(),
    ]);

    return { limits, counts };
  }

  async updateUserLimits(
    updatedLimits: Partial<UserLimits>
  ): Promise<UserLimits> {
    await this.ensureInitialized();
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const userLimits = this.db.getUserLimits();
    const index = userLimits.findIndex(
      (ul) => ul.userId === this.currentUser!.id
    );

    if (index === -1) {
      throw new Error('User limits not found');
    }

    // Update limits
    userLimits[index] = {
      ...userLimits[index],
      ...updatedLimits,
      updatedAt: new Date(),
    };

    this.db.setUserLimits(userLimits);
    return userLimits[index];
  }

  async canCreateRequest(): Promise<boolean> {
    const { limits, counts } = await this.getUserLimitsWithCounts();
    return counts.openRequestsCount < limits.maxOpenRequests;
  }

  async canCreateGroup(): Promise<boolean> {
    const { limits, counts } = await this.getUserLimitsWithCounts();
    return counts.groupsCreatedCount < limits.maxGroupsCreated;
  }

  async canJoinGroup(): Promise<boolean> {
    const { limits, counts } = await this.getUserLimitsWithCounts();
    return counts.groupsJoinedCount < limits.maxGroupsJoined;
  }

  async getAdminMetrics(): Promise<AdminMetrics> {
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (!this.currentUser.isAdmin) {
      throw new Error('Access denied: Admin privileges required');
    }

    const users = this.db.getUsers();
    const groups = this.db.getGroups();
    const requests = this.db.getRequests();
    const groupMembers = this.db.getGroupMembers();

    // Calculate metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Active users (users created in last 30 days as approximation)
    const activeUsers = users.filter(
      (u) => new Date(u.createdAt) > thirtyDaysAgo
    ).length;

    // Requests this month
    const requestsThisMonth = requests.filter(
      (r) => new Date(r.createdAt) > thisMonth
    ).length;

    // Fulfillment rate
    const fulfilledOrClaimed = requests.filter(
      (r) => r.status === 'claimed' || r.status === 'fulfilled'
    ).length;
    const fulfillmentRate =
      requests.length > 0 ? (fulfilledOrClaimed / requests.length) * 100 : 0;

    // Average time to claim
    const claimedRequests = requests.filter((r) => r.claimedAt);
    const avgTimeToClaimMs =
      claimedRequests.length > 0
        ? claimedRequests.reduce((sum, req) => {
            const claimTime =
              new Date(req.claimedAt!).getTime() -
              new Date(req.createdAt).getTime();
            return sum + claimTime;
          }, 0) / claimedRequests.length
        : 0;
    const avgTimeToClaimHours = avgTimeToClaimMs / (1000 * 60 * 60);

    // Average group size
    const groupSizes = groupMembers.reduce(
      (acc, member) => {
        acc[member.groupId] = (acc[member.groupId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const avgGroupSize =
      Object.keys(groupSizes).length > 0
        ? Object.values(groupSizes).reduce((sum, size) => sum + size, 0) /
          Object.keys(groupSizes).length
        : 0;

    return {
      totalUsers: users.length,
      activeUsers,
      totalGroups: groups.length,
      totalRequestsThisMonth: requestsThisMonth,
      fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
      averageTimeToClaimHours: Math.round(avgTimeToClaimHours * 100) / 100,
      averageGroupSize: Math.round(avgGroupSize * 100) / 100,
    };
  }

  // Email preferences services
  async getEmailPreferences(): Promise<EmailPreferences> {
    await this.ensureInitialized();
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    // Mock storage for email preferences
    const preferences = localStorage.getItem(
      `email_prefs_${this.currentUser.id}`
    );
    if (preferences) {
      const parsed = JSON.parse(preferences);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
        lastDailySent: parsed.lastDailySent
          ? new Date(parsed.lastDailySent)
          : undefined,
      };
    }

    // Return default preferences
    const defaultPrefs: EmailPreferences = {
      userId: this.currentUser.id,
      frequency: 'disabled',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    localStorage.setItem(
      `email_prefs_${this.currentUser.id}`,
      JSON.stringify(defaultPrefs)
    );
    return defaultPrefs;
  }

  async updateEmailPreferences(
    preferences: EmailPreferencesForm
  ): Promise<EmailPreferences> {
    await this.ensureInitialized();
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const currentPrefs = await this.getEmailPreferences();
    const updatedPrefs: EmailPreferences = {
      ...currentPrefs,
      frequency: preferences.frequency,
      updatedAt: new Date(),
    };

    localStorage.setItem(
      `email_prefs_${this.currentUser.id}`,
      JSON.stringify(updatedPrefs)
    );
    return updatedPrefs;
  }

  async sendImmediateNotification(requestId: string): Promise<void> {
    await this.ensureInitialized();
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user, requiest id: ' + requestId);
    }

    // Mock implementation - in a real app this would send actual notifications
    // requestId would be used to fetch request details

    // In a real implementation, this would:
    // 1. Get the request details using requestId
    // 2. Find group members with immediate notification preferences
    // 3. Send emails to those members
    // 4. Log the email sends

    // For now, just simulate a successful send
    return Promise.resolve();
  }

  async getPendingInvitations(): Promise<PendingInvitation[]> {
    await this.ensureInitialized();
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const invites = this.db.getInvites();
    const groups = this.db.getGroups();
    const users = this.db.getUsers();

    // Find invites for current user's email that haven't been used and haven't expired
    const pendingInvites = invites.filter((invite) => {
      if (invite.email !== this.currentUser!.email) return false;
      if (invite.usedAt) return false;
      if (new Date(invite.expiresAt) < new Date()) return false;
      return true;
    });

    // Transform to PendingInvitation with group and inviter info
    const pendingInvitations: PendingInvitation[] = [];
    for (const invite of pendingInvites) {
      const group = groups.find((g) => g.id === invite.groupId);
      if (!group) continue;

      const inviter = users.find((u) => u.id === group.createdBy);
      if (!inviter) continue;

      pendingInvitations.push({
        id: invite.id,
        groupId: invite.groupId,
        groupName: group.name,
        inviterName: inviter.name,
        email: invite.email,
        token: invite.token,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      });
    }

    return pendingInvitations;
  }

  async getPendingOutgoingInvitations(): Promise<PendingOutgoingInvitation[]> {
    await this.ensureInitialized();
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const invites = this.db.getInvites();
    const groups = this.db.getGroups();

    // Find invites sent by current user that haven't been used and haven't expired
    const outgoingInvites = invites.filter((invite) => {
      // For mock service, we'll check if the user is the group owner
      const group = groups.find((g) => g.id === invite.groupId);
      if (!group || group.createdBy !== this.currentUser!.id) return false;
      if (invite.usedAt) return false;
      if (new Date(invite.expiresAt) < new Date()) return false;
      return true;
    });

    // Transform to PendingOutgoingInvitation with group info
    const pendingOutgoingInvitations: PendingOutgoingInvitation[] = [];
    for (const invite of outgoingInvites) {
      const group = groups.find((g) => g.id === invite.groupId);
      if (!group) continue;

      pendingOutgoingInvitations.push({
        id: invite.id,
        groupId: invite.groupId,
        groupName: group.name,
        email: invite.email,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        usedAt: invite.usedAt || null,
      });
    }

    return pendingOutgoingInvitations;
  }

  async getInvitationCount(): Promise<{ current: number; max: number }> {
    await this.ensureInitialized();
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const invites = this.db.getInvites();
    const groups = this.db.getGroups();

    // Count invites sent by current user that haven't been used and haven't expired
    const pendingCount = invites.filter((invite) => {
      // For mock service, we'll check if the user is the group owner
      const group = groups.find((g) => g.id === invite.groupId);
      if (!group || group.createdBy !== this.currentUser!.id) return false;
      if (invite.usedAt) return false;
      if (new Date(invite.expiresAt) < new Date()) return false;
      return true;
    }).length;

    return {
      current: pendingCount,
      max: 10,
    };
  }

  async acceptInvitation(token: string): Promise<Group> {
    await this.ensureInitialized();
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const invites = this.db.getInvites();
    const invite = invites.find((inv) => inv.token === token);

    if (!invite) {
      throw new Error('Invalid invitation token');
    }

    if (invite.usedAt) {
      throw new Error('Invitation has already been used');
    }

    if (new Date(invite.expiresAt) < new Date()) {
      throw new Error('Invitation has expired');
    }

    if (invite.email !== this.currentUser.email) {
      throw new Error('Invitation is not for your email address');
    }

    const groups = this.db.getGroups();
    const group = groups.find((g) => g.id === invite.groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is already a member
    const groupMembers = this.db.getGroupMembers();
    const existingMembership = groupMembers.find(
      (gm) =>
        gm.groupId === invite.groupId && gm.userId === this.currentUser!.id
    );

    if (existingMembership) {
      throw new Error('You are already a member of this group');
    }

    // Add user to group
    groupMembers.push({
      groupId: invite.groupId,
      userId: this.currentUser.id,
      joinedAt: new Date(),
    });
    this.db.setGroupMembers(groupMembers);

    // Mark invitation as used
    invite.usedAt = new Date();
    this.db.setInvites(invites);

    return group;
  }

  async declineInvitation(token: string): Promise<void> {
    await this.ensureInitialized();
    await this.delay();

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const invites = this.db.getInvites();
    const invite = invites.find((inv) => inv.token === token);

    if (!invite) {
      throw new Error('Invalid invitation token');
    }

    if (invite.usedAt) {
      throw new Error('Invitation has already been used');
    }

    if (invite.email !== this.currentUser.email) {
      throw new Error('Invitation is not for your email address');
    }

    // Mark invitation as used (declined)
    invite.usedAt = new Date();
    this.db.setInvites(invites);
  }
}
