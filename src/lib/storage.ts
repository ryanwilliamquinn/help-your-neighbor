// Simple storage factory - file storage for dev, in-memory for tests

import { SimpleFileStorageDB } from './fileStorageSimple';
import { TestStorageDB } from './testStorage';
import type { User, Group, GroupMember, Request, Invite } from '../types';

export interface StorageAdapter {
  getUsers(): User[];
  setUsers(users: User[]): void;
  getGroups(): Group[];
  setGroups(groups: Group[]): void;
  getGroupMembers(): GroupMember[];
  setGroupMembers(groupMembers: GroupMember[]): void;
  getRequests(): Request[];
  setRequests(requests: Request[]): void;
  getInvites(): Invite[];
  setInvites(invites: Invite[]): void;
  getCurrentUser(): User | null;
  setCurrentUser(user: User | null): void;
  clearAll(): void;
  generateId(): string;
}

// Check if we're in a test environment
const isTestEnvironment = (): boolean => {
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
};

// Check if we're in a browser environment
const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

class StorageFactory {
  private static storageInstance: StorageAdapter | null = null;

  static async getStorage(): Promise<StorageAdapter> {
    if (this.storageInstance) {
      return this.storageInstance;
    }

    if (isTestEnvironment()) {
      // Use in-memory storage for tests
      this.storageInstance = TestStorageDB.createClean();
    } else if (isBrowser()) {
      // Use file storage for browser/dev environment
      const fileStorage = SimpleFileStorageDB.getInstance();
      await fileStorage.initialize();
      this.storageInstance = fileStorage;
    } else {
      // Fallback to in-memory storage
      this.storageInstance = TestStorageDB.createClean();
    }

    return this.storageInstance;
  }

  // Reset storage instance (useful for tests)
  static reset(): void {
    this.storageInstance = null;
  }
}

export { StorageFactory };
