import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

// Types matching the frontend
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  generalArea: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  joinedAt: string;
}

export enum RequestStatus {
  Open = 'open',
  Claimed = 'claimed',
  Fulfilled = 'fulfilled',
}

export interface Request {
  id: string;
  userId: string;
  groupId: string;
  itemDescription: string;
  storePreference?: string;
  neededBy: string;
  pickupNotes?: string;
  status: RequestStatus;
  claimedBy?: string;
  claimedAt?: string;
  createdAt: string;
  fulfilledAt?: string;
}

export interface Invite {
  id: string;
  groupId: string;
  email: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface MockData {
  users: User[];
  groups: Group[];
  groupMembers: GroupMember[];
  requests: Request[];
  invites: Invite[];
  sessions: Session[];
  currentUser: User | null;
  lastUpdated: string;
}

export class DataStorage {
  private data: MockData | null = null;

  async load(): Promise<MockData> {
    if (this.data) {
      return this.data;
    }

    try {
      const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
      this.data = JSON.parse(fileContent);
      return this.data!;
    } catch {
      throw new Error('Could not load data file');
    }
  }

  async save(): Promise<void> {
    if (!this.data) {
      throw new Error('No data to save');
    }

    this.data.lastUpdated = new Date().toISOString();

    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(this.data, null, 2));
    } catch {
      throw new Error('Could not save data file');
    }
  }

  getData(): MockData {
    if (!this.data) {
      throw new Error('Data not loaded');
    }
    return this.data;
  }

  updateData(data: MockData): void {
    this.data = data;
  }

  generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  getSessions(): Session[] {
    if (!this.data) {
      throw new Error('Data not loaded');
    }
    return this.data.sessions;
  }

  setSessions(sessions: Session[]): void {
    if (!this.data) {
      throw new Error('Data not loaded');
    }
    this.data.sessions = sessions;
  }

  getUsers(): User[] {
    if (!this.data) {
      throw new Error('Data not loaded');
    }
    return this.data.users;
  }
}

// Singleton instance
export const storage = new DataStorage();
