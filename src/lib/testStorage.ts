// Test-specific storage implementation that doesn't depend on fetch or files
import type { StorageAdapter } from './storage';
import type {
  User,
  Group,
  GroupMember,
  Request,
  Invite,
  UserLimits,
} from '../types';
import { AuthStorage } from './authStorage';

export class TestStorageDB implements StorageAdapter {
  private users: User[] = [];
  private groups: Group[] = [];
  private groupMembers: GroupMember[] = [];
  private requests: Request[] = [];
  private invites: Invite[] = [];
  private userLimits: UserLimits[] = [];
  private currentUser: User | null = null;

  constructor(initialData?: {
    users?: User[];
    groups?: Group[];
    groupMembers?: GroupMember[];
    requests?: Request[];
    invites?: Invite[];
    userLimits?: UserLimits[];
    currentUser?: User | null;
  }) {
    if (initialData) {
      this.users = [...(initialData.users || [])];
      this.groups = [...(initialData.groups || [])];
      this.groupMembers = [...(initialData.groupMembers || [])];
      this.requests = [...(initialData.requests || [])];
      this.invites = [...(initialData.invites || [])];
      this.userLimits = [...(initialData.userLimits || [])];
      this.currentUser = initialData.currentUser || null;
    }
  }

  getUsers(): User[] {
    return [...this.users];
  }

  setUsers(users: User[]): void {
    this.users = [...users];
  }

  getGroups(): Group[] {
    return [...this.groups];
  }

  setGroups(groups: Group[]): void {
    this.groups = [...groups];
  }

  getGroupMembers(): GroupMember[] {
    return [...this.groupMembers];
  }

  setGroupMembers(groupMembers: GroupMember[]): void {
    this.groupMembers = [...groupMembers];
  }

  getRequests(): Request[] {
    return [...this.requests];
  }

  setRequests(requests: Request[]): void {
    this.requests = [...requests];
  }

  getInvites(): Invite[] {
    return [...this.invites];
  }

  setInvites(invites: Invite[]): void {
    this.invites = [...invites];
  }

  getUserLimits(): UserLimits[] {
    return [...this.userLimits];
  }

  setUserLimits(userLimits: UserLimits[]): void {
    this.userLimits = [...userLimits];
  }

  getCurrentUser(): User | null {
    // In test environment, localStorage won't be available so this will fall back to in-memory
    // But we use the same interface for consistency
    const storedUser = AuthStorage.getCurrentUser();
    if (storedUser) {
      return storedUser;
    }
    return this.currentUser ? { ...this.currentUser } : null;
  }

  setCurrentUser(user: User | null): void {
    // Try to use AuthStorage, but fall back to in-memory for tests
    AuthStorage.setCurrentUser(user);
    this.currentUser = user ? { ...user } : null;
  }

  clearAll(): void {
    this.users = [];
    this.groups = [];
    this.groupMembers = [];
    this.requests = [];
    this.invites = [];
    this.userLimits = [];
    this.currentUser = null;
    AuthStorage.clearCurrentUser();
  }

  generateId(): string {
    return 'test-' + Math.random().toString(36).substr(2, 9);
  }

  // Helper method to get a fresh instance with clean state
  static createClean(): TestStorageDB {
    return new TestStorageDB();
  }

  // Helper method to create with sample data for specific tests
  static createWithSampleData(): TestStorageDB {
    const sampleUser: User = {
      id: 'alice-001',
      email: 'alice@example.com',
      name: 'Alice Johnson',
      phone: '555-0101',
      generalArea: 'Downtown',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    const sampleGroup: Group = {
      id: 'group-001',
      name: 'Downtown Neighbors',
      createdBy: 'alice-001',
      createdAt: new Date('2024-01-01T01:00:00.000Z'),
    };

    const sampleInvite: Invite = {
      id: 'invite-001',
      token: 'sample-invite-token-123',
      groupId: 'group-001',
      email: 'newuser@example.com',
      createdAt: new Date('2024-01-01T02:00:00.000Z'),
      expiresAt: new Date('2026-01-01T02:00:00.000Z'),
      usedAt: undefined,
    };

    const sampleGroupMember: GroupMember = {
      groupId: 'group-001',
      userId: 'alice-001',
      joinedAt: new Date('2024-01-01T01:00:00.000Z'),
    };

    return new TestStorageDB({
      users: [sampleUser],
      groups: [sampleGroup],
      groupMembers: [sampleGroupMember],
      requests: [],
      invites: [sampleInvite],
      currentUser: null,
    });
  }
}
