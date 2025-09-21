// Simple localStorage utility for currentUser persistence
import type { User } from '../types';

const CURRENT_USER_KEY = 'help-your-neighbor-current-user';

export class AuthStorage {
  // Check if localStorage is available
  private static isAvailable(): boolean {
    try {
      return (
        typeof window !== 'undefined' &&
        typeof window.localStorage !== 'undefined'
      );
    } catch {
      return false;
    }
  }

  // Get current user from localStorage
  static getCurrentUser(): User | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (!stored) {
        return null;
      }

      const user = JSON.parse(stored);

      // Validate that it's a proper user object
      if (typeof user === 'object' && user.id && user.email) {
        // Convert date strings back to Date objects
        if (user.createdAt && typeof user.createdAt === 'string') {
          user.createdAt = new Date(user.createdAt);
        }
        return user;
      }

      return null;
    } catch {
      this.clearCurrentUser(); // Clear corrupted data
      return null;
    }
  }

  // Save current user to localStorage
  static setCurrentUser(user: User | null): void {
    if (!this.isAvailable()) {
      return;
    }

    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  // Clear current user from localStorage
  static clearCurrentUser(): void {
    if (!this.isAvailable()) {
      return;
    }

    localStorage.removeItem(CURRENT_USER_KEY);
  }
}
