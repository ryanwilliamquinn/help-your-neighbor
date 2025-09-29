import { MockApiService } from './mockApiService';
import { TestStorageDB } from '../lib/testStorage';
import type { EmailPreferences, EmailPreferencesForm } from '../types';

// Mock console.log to avoid test output noise
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('Email Preferences API', () => {
  let apiService: MockApiService;
  let currentUser: { id: string; email: string };
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    phone: '555-1234',
    generalArea: 'Test Area',
  };

  beforeEach(async () => {
    // Clear localStorage before each test
    localStorage.clear();

    // Create a new API service instance with test storage
    apiService = new MockApiService(new TestStorageDB());

    // Sign up and sign in a test user
    await apiService.signUp(testUser.email, testUser.password);
    await apiService.signIn(testUser.email, testUser.password);

    // Get the current user to get the actual ID
    currentUser = await apiService.getCurrentUser();

    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getEmailPreferences', () => {
    it('returns default preferences for new user', async () => {
      const preferences = await apiService.getEmailPreferences();

      expect(preferences).toEqual({
        userId: currentUser.id,
        frequency: 'disabled',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Should store preferences in localStorage for subsequent calls
      const stored = localStorage.getItem(`email_prefs_${currentUser.id}`);
      expect(stored).toBeTruthy();
    });

    it('returns stored preferences if they exist', async () => {
      const storedPrefs: EmailPreferences = {
        userId: currentUser.id,
        frequency: 'daily',
        lastDailySent: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      localStorage.setItem(
        `email_prefs_${currentUser.id}`,
        JSON.stringify(storedPrefs)
      );

      const preferences = await apiService.getEmailPreferences();

      expect(preferences).toEqual({
        userId: currentUser.id,
        frequency: 'daily',
        lastDailySent: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });
    });

    it('throws error when user is not authenticated', async () => {
      await apiService.signOut();

      await expect(apiService.getEmailPreferences()).rejects.toThrow(
        'No authenticated user'
      );
    });
  });

  describe('updateEmailPreferences', () => {
    it('updates email preferences successfully', async () => {
      const updateForm: EmailPreferencesForm = {
        frequency: 'immediate',
      };

      const updatedPrefs = await apiService.updateEmailPreferences(updateForm);

      expect(updatedPrefs.frequency).toBe('immediate');
      expect(updatedPrefs.userId).toBe(currentUser.id);
      expect(updatedPrefs.updatedAt).toBeInstanceOf(Date);

      // Verify preferences are stored in localStorage
      const stored = localStorage.getItem(`email_prefs_${currentUser.id}`);
      expect(stored).toBeTruthy();
      const parsedStored = JSON.parse(stored!);
      expect(parsedStored.frequency).toBe('immediate');
    });

    it('preserves existing preferences when updating', async () => {
      // First set some preferences
      const initialForm: EmailPreferencesForm = {
        frequency: 'daily',
      };
      await apiService.updateEmailPreferences(initialForm);

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Update frequency
      const updateForm: EmailPreferencesForm = {
        frequency: 'immediate',
      };
      const updatedPrefs = await apiService.updateEmailPreferences(updateForm);

      expect(updatedPrefs.frequency).toBe('immediate');
      expect(updatedPrefs.userId).toBe(currentUser.id);
      expect(updatedPrefs.createdAt).toBeInstanceOf(Date);
      expect(updatedPrefs.updatedAt).toBeInstanceOf(Date);
      expect(updatedPrefs.updatedAt.getTime()).toBeGreaterThan(
        updatedPrefs.createdAt.getTime()
      );
    });

    it('throws error when user is not authenticated', async () => {
      await apiService.signOut();

      const updateForm: EmailPreferencesForm = {
        frequency: 'daily',
      };

      await expect(
        apiService.updateEmailPreferences(updateForm)
      ).rejects.toThrow('No authenticated user');
    });

    it('handles all frequency options', async () => {
      const frequencies: Array<'disabled' | 'daily' | 'immediate'> = [
        'disabled',
        'daily',
        'immediate',
      ];

      for (const frequency of frequencies) {
        const updateForm: EmailPreferencesForm = { frequency };
        const updatedPrefs =
          await apiService.updateEmailPreferences(updateForm);
        expect(updatedPrefs.frequency).toBe(frequency);
      }
    });
  });

  describe('sendImmediateNotification', () => {
    it('completes successfully for valid request', async () => {
      const requestId = 'test-request-id';

      await expect(
        apiService.sendImmediateNotification(requestId)
      ).resolves.toBeUndefined();
    });

    it('throws error when user is not authenticated', async () => {
      await apiService.signOut();

      await expect(
        apiService.sendImmediateNotification('request-id')
      ).rejects.toThrow('No authenticated user');
    });

    it('completes successfully without errors', async () => {
      const requestId = 'test-request-id';

      await expect(
        apiService.sendImmediateNotification(requestId)
      ).resolves.toBeUndefined();
    });
  });

  describe('integration scenarios', () => {
    it('handles complete email preferences workflow', async () => {
      // 1. Get default preferences
      let preferences = await apiService.getEmailPreferences();
      expect(preferences.frequency).toBe('disabled');

      // 2. Update to daily
      const dailyForm: EmailPreferencesForm = { frequency: 'daily' };
      preferences = await apiService.updateEmailPreferences(dailyForm);
      expect(preferences.frequency).toBe('daily');

      // 3. Get preferences again to verify persistence
      preferences = await apiService.getEmailPreferences();
      expect(preferences.frequency).toBe('daily');

      // 4. Update to immediate
      const immediateForm: EmailPreferencesForm = { frequency: 'immediate' };
      preferences = await apiService.updateEmailPreferences(immediateForm);
      expect(preferences.frequency).toBe('immediate');

      // 5. Send notification (should work regardless of preferences in mock)
      await expect(
        apiService.sendImmediateNotification('test-request')
      ).resolves.toBeUndefined();

      // 6. Update back to disabled
      const disabledForm: EmailPreferencesForm = { frequency: 'disabled' };
      preferences = await apiService.updateEmailPreferences(disabledForm);
      expect(preferences.frequency).toBe('disabled');
    });

    it('maintains preferences across different users', async () => {
      // Set preferences for first user
      const firstUserForm: EmailPreferencesForm = { frequency: 'daily' };
      await apiService.updateEmailPreferences(firstUserForm);

      // Sign out and create second user
      await apiService.signOut();
      const secondUser = {
        email: 'user2@example.com',
        password: 'password123',
      };
      await apiService.signUp(secondUser.email, secondUser.password);
      await apiService.signIn(secondUser.email, secondUser.password);

      // Second user should have default preferences
      let secondUserPrefs = await apiService.getEmailPreferences();
      expect(secondUserPrefs.frequency).toBe('disabled');

      // Set different preferences for second user
      const secondUserForm: EmailPreferencesForm = { frequency: 'immediate' };
      secondUserPrefs = await apiService.updateEmailPreferences(secondUserForm);
      expect(secondUserPrefs.frequency).toBe('immediate');

      // Sign back in as first user
      await apiService.signOut();
      await apiService.signIn(testUser.email, testUser.password);

      // First user's preferences should be preserved
      const firstUserPrefs = await apiService.getEmailPreferences();
      expect(firstUserPrefs.frequency).toBe('daily');
    });

    it('handles rapid preference updates correctly', async () => {
      const updates = [
        { frequency: 'daily' as const },
        { frequency: 'immediate' as const },
        { frequency: 'disabled' as const },
        { frequency: 'daily' as const },
      ];

      for (let i = 0; i < updates.length; i++) {
        const preferences = await apiService.updateEmailPreferences(updates[i]);
        expect(preferences.frequency).toBe(updates[i].frequency);

        // Add small delay to ensure different timestamps
        if (i < updates.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
      }

      // Final verification
      const finalPrefs = await apiService.getEmailPreferences();
      expect(finalPrefs.frequency).toBe('daily');
    });
  });
});
