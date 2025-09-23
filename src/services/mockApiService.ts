// Mock API service using localStorage for offline development

import type {
  User,
  Group,
  Request,
  Invite,
  AuthResponse,
  CreateRequestForm,
  UserProfileForm,
  RequestStatus,
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
          createdAt: new Date(),
        },
        {
          id: this.db.generateId(),
          email: 'bob@example.com',
          name: 'Bob Smith',
          phone: '555-0102',
          generalArea: 'Midtown',
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

  async resetPassword(email: string): Promise<void> {
    await this.ensureInitialized();
    await this.delay();
    console.log(`Mock: Password reset email sent to ${email}`);
  }

  async updatePassword(password: string): Promise<void> {
    await this.ensureInitialized();
    await this.delay();
    console.log('Mock: Password updated successfully');
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
}
