import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuthStorage } from './authStorage';
import type { User } from '../types';

// Mock localStorage for tests
const localStorageMock = ((): Storage => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    length: 0,
    key: (): null => null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AuthStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  const sampleUser: User = {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    phone: '555-0123',
    generalArea: 'Test Area',
    isAdmin: false,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  it('should store and retrieve current user', () => {
    // Initially no user
    expect(AuthStorage.getCurrentUser()).toBeNull();

    // Set user
    AuthStorage.setCurrentUser(sampleUser);

    // Retrieve user
    const retrievedUser = AuthStorage.getCurrentUser();
    expect(retrievedUser).toEqual(sampleUser);
    expect(retrievedUser?.createdAt).toBeInstanceOf(Date);
  });

  it('should handle null user (sign out)', () => {
    // Set user first
    AuthStorage.setCurrentUser(sampleUser);
    expect(AuthStorage.getCurrentUser()).toEqual(sampleUser);

    // Clear user
    AuthStorage.setCurrentUser(null);
    expect(AuthStorage.getCurrentUser()).toBeNull();
  });

  it('should clear current user', () => {
    // Set user first
    AuthStorage.setCurrentUser(sampleUser);
    expect(AuthStorage.getCurrentUser()).toEqual(sampleUser);

    // Clear user
    AuthStorage.clearCurrentUser();
    expect(AuthStorage.getCurrentUser()).toBeNull();
  });

  it('should handle corrupted localStorage data', () => {
    // Manually set corrupted data
    localStorage.setItem('help-your-neighbor-current-user', 'invalid json');

    // Should return null and clear corrupted data
    expect(AuthStorage.getCurrentUser()).toBeNull();

    // Storage should be cleared
    expect(localStorage.getItem('help-your-neighbor-current-user')).toBeNull();
  });

  it('should handle missing required fields', () => {
    // Set incomplete user data
    localStorage.setItem(
      'help-your-neighbor-current-user',
      JSON.stringify({ name: 'Test' })
    );

    // Should return null for incomplete data
    expect(AuthStorage.getCurrentUser()).toBeNull();
  });

  it('should convert date strings back to Date objects', () => {
    const userWithStringDate = {
      ...sampleUser,
      createdAt: sampleUser.createdAt.toISOString(), // Convert to string
    };

    // Manually set as string date
    localStorage.setItem(
      'help-your-neighbor-current-user',
      JSON.stringify(userWithStringDate)
    );

    // Should retrieve with Date object
    const retrievedUser = AuthStorage.getCurrentUser();
    expect(retrievedUser?.createdAt).toBeInstanceOf(Date);
    expect(retrievedUser?.createdAt.getTime()).toBe(
      sampleUser.createdAt.getTime()
    );
  });
});
