// Simple file-based storage that reads from JSON file and keeps data in memory

import type {
  User,
  Group,
  GroupMember,
  Request,
  Invite,
  UserLimits,
} from '../types';
import {
  validateUsers,
  validateGroups,
  validateGroupMembers,
  validateRequests,
  validateInvites,
  validateUser,
} from '../utils/typeGuards';
import type { StorageAdapter } from './storage';
import { AuthStorage } from './authStorage';

// Data structure for the JSON file
interface MockDataFile {
  users: User[];
  groups: Group[];
  groupMembers: GroupMember[];
  requests: Request[];
  invites: Invite[];
  userLimits: UserLimits[];
  currentUser: User | null;
  lastUpdated: string;
}

const MOCK_DATA_FILE = '/mock-data.json';

export class SimpleFileStorageDB implements StorageAdapter {
  private static instance: SimpleFileStorageDB;
  private data: MockDataFile;
  private isInitialized = false;

  private constructor() {
    this.data = {
      users: [],
      groups: [],
      groupMembers: [],
      requests: [],
      invites: [],
      userLimits: [],
      currentUser: null,
      lastUpdated: new Date().toISOString(),
    };
  }

  static getInstance(): SimpleFileStorageDB {
    if (!SimpleFileStorageDB.instance) {
      SimpleFileStorageDB.instance = new SimpleFileStorageDB();
    }
    return SimpleFileStorageDB.instance;
  }

  // Initialize by loading data from file into memory
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const response = await fetch(MOCK_DATA_FILE);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const fileData = await response.json();

      // Validate and load the file data into memory
      this.data = {
        users: validateUsers(fileData.users || []),
        groups: validateGroups(fileData.groups || []),
        groupMembers: validateGroupMembers(fileData.groupMembers || []),
        requests: validateRequests(fileData.requests || []),
        invites: validateInvites(fileData.invites || []),
        userLimits: fileData.userLimits || [],
        currentUser: fileData.currentUser
          ? validateUser(fileData.currentUser)
          : null,
        lastUpdated: fileData.lastUpdated || new Date().toISOString(),
      };

      this.isInitialized = true;
    } catch {
      this.isInitialized = true;
    }
  }

  // All operations work with in-memory data
  getUsers(): User[] {
    return [...this.data.users];
  }

  setUsers(users: User[]): void {
    this.data.users = users;
    this.data.lastUpdated = new Date().toISOString();
  }

  getGroups(): Group[] {
    return [...this.data.groups];
  }

  setGroups(groups: Group[]): void {
    this.data.groups = groups;
    this.data.lastUpdated = new Date().toISOString();
  }

  getGroupMembers(): GroupMember[] {
    return [...this.data.groupMembers];
  }

  setGroupMembers(groupMembers: GroupMember[]): void {
    this.data.groupMembers = groupMembers;
    this.data.lastUpdated = new Date().toISOString();
  }

  getRequests(): Request[] {
    return [...this.data.requests];
  }

  setRequests(requests: Request[]): void {
    this.data.requests = requests;
    this.data.lastUpdated = new Date().toISOString();
  }

  getInvites(): Invite[] {
    return [...this.data.invites];
  }

  setInvites(invites: Invite[]): void {
    this.data.invites = invites;
    this.data.lastUpdated = new Date().toISOString();
  }

  getUserLimits(): UserLimits[] {
    return [...this.data.userLimits];
  }

  setUserLimits(userLimits: UserLimits[]): void {
    this.data.userLimits = userLimits;
    this.data.lastUpdated = new Date().toISOString();
  }

  getCurrentUser(): User | null {
    // Use AuthStorage for persistent currentUser across page refreshes
    return AuthStorage.getCurrentUser();
  }

  setCurrentUser(user: User | null): void {
    // Use AuthStorage for persistent currentUser across page refreshes
    AuthStorage.setCurrentUser(user);
    this.data.lastUpdated = new Date().toISOString();
  }

  clearAll(): void {
    this.data = {
      users: [],
      groups: [],
      groupMembers: [],
      requests: [],
      invites: [],
      userLimits: [],
      currentUser: null,
      lastUpdated: new Date().toISOString(),
    };
    AuthStorage.clearCurrentUser();
  }

  generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Export current in-memory data to file format
  exportData(): MockDataFile {
    return { ...this.data };
  }

  // Download current data as JSON file
  downloadData(filename = 'mock-data.json'): void {
    const data = this.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
