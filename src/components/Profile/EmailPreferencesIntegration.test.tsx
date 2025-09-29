import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailPreferencesSection from './EmailPreferencesSection';
import { apiService } from '@/services';

// Mock the useToast hook
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

jest.mock('@/hooks', () => ({
  useToast: (): typeof mockToast => mockToast,
}));

// Mock the services with real MockApiService
jest.mock('@/services', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockApiService } = require('@/services/mockApiService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TestStorageDB } = require('@/lib/testStorage');
  return {
    apiService: new MockApiService(new TestStorageDB()),
  };
});

describe('Email Preferences Integration Tests', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    phone: '555-1234',
    generalArea: 'Test Area',
  };

  beforeEach(async () => {
    // Clear localStorage and reset mocks
    localStorage.clear();
    jest.clearAllMocks();

    // Set up authenticated user (try signup, fallback to signin if user exists)
    try {
      await apiService.signUp(testUser.email, testUser.password);
    } catch {
      // User might already exist, try to sign in instead
    }
    await apiService.signIn(testUser.email, testUser.password);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('completes full email preferences workflow', async () => {
    render(<EmailPreferencesSection />);

    // Wait for component to load and preferences to be fetched
    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(
        screen.queryByText('Loading preferences...')
      ).not.toBeInTheDocument();
    });

    // Initially should show disabled option selected (default)
    expect(screen.getByDisplayValue('disabled')).toBeChecked();

    // Change to daily notifications
    const dailyRadio = screen.getByDisplayValue('daily');
    fireEvent.click(dailyRadio);

    // Should show form actions
    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    // Save the changes
    fireEvent.click(screen.getByText('Save Preferences'));

    // Should show success message and hide form actions
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        'Email preferences updated successfully'
      );
      expect(screen.queryByText('Save Preferences')).not.toBeInTheDocument();
    });

    // Verify the change persisted by checking the radio button
    expect(screen.getByDisplayValue('daily')).toBeChecked();

    // Change to immediate notifications
    const immediateRadio = screen.getByDisplayValue('immediate');
    fireEvent.click(immediateRadio);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    // Save again
    fireEvent.click(screen.getByText('Save Preferences'));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledTimes(2);
      expect(screen.queryByText('Save Preferences')).not.toBeInTheDocument();
    });

    // Verify immediate is now selected
    expect(screen.getByDisplayValue('immediate')).toBeChecked();
  });

  it('handles cancellation correctly', async () => {
    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(
        screen.queryByText('Loading preferences...')
      ).not.toBeInTheDocument();
    });

    // Start with disabled (default)
    expect(screen.getByDisplayValue('disabled')).toBeChecked();

    // Change to daily
    const dailyRadio = screen.getByDisplayValue('daily');
    fireEvent.click(dailyRadio);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Should revert to original value
    expect(screen.getByDisplayValue('disabled')).toBeChecked();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();

    // No API call should have been made
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('persists preferences across component remounts', async () => {
    // First render - change to daily
    const { unmount } = render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(
        screen.queryByText('Loading preferences...')
      ).not.toBeInTheDocument();
    });

    const dailyRadio = screen.getByDisplayValue('daily');
    fireEvent.click(dailyRadio);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save Preferences'));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled();
    });

    // Unmount component
    unmount();

    // Re-render component
    render(<EmailPreferencesSection />);

    // Should load with daily selected
    await waitFor(() => {
      expect(screen.getByDisplayValue('daily')).toBeChecked();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock a failing API call for this test
    const originalUpdate = apiService.updateEmailPreferences;
    apiService.updateEmailPreferences = jest
      .fn()
      .mockRejectedValue(new Error('API Error'));

    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(
        screen.queryByText('Loading preferences...')
      ).not.toBeInTheDocument();
    });

    // Change to daily
    const dailyRadio = screen.getByDisplayValue('daily');
    fireEvent.click(dailyRadio);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    // Try to save
    fireEvent.click(screen.getByText('Save Preferences'));

    // Should show error message
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('API Error');
    });

    // Should still show the form actions since save failed
    expect(screen.getByText('Save Preferences')).toBeInTheDocument();

    // Restore original function
    apiService.updateEmailPreferences = originalUpdate;
  });

  it('shows loading states during API calls', async () => {
    // Mock a slow API call
    const originalUpdate = apiService.updateEmailPreferences;
    apiService.updateEmailPreferences = jest
      .fn()
      .mockImplementation(
        (prefs) =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve(originalUpdate.call(apiService, prefs)),
              100
            )
          )
      );

    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(
        screen.queryByText('Loading preferences...')
      ).not.toBeInTheDocument();
    });

    // Change to daily
    const dailyRadio = screen.getByDisplayValue('daily');
    fireEvent.click(dailyRadio);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    // Click save
    fireEvent.click(screen.getByText('Save Preferences'));

    // Should show loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      expect(mockToast.success).toHaveBeenCalled();
    });

    // Restore original function
    apiService.updateEmailPreferences = originalUpdate;
  });

  it('validates radio button behavior', async () => {
    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(
        screen.queryByText('Loading preferences...')
      ).not.toBeInTheDocument();
    });

    const disabledRadio = screen.getByDisplayValue('disabled');
    const dailyRadio = screen.getByDisplayValue('daily');
    const immediateRadio = screen.getByDisplayValue('immediate');

    // Initially disabled should be checked
    expect(disabledRadio).toBeChecked();
    expect(dailyRadio).not.toBeChecked();
    expect(immediateRadio).not.toBeChecked();

    // Click daily
    fireEvent.click(dailyRadio);

    expect(disabledRadio).not.toBeChecked();
    expect(dailyRadio).toBeChecked();
    expect(immediateRadio).not.toBeChecked();

    // Click immediate
    fireEvent.click(immediateRadio);

    expect(disabledRadio).not.toBeChecked();
    expect(dailyRadio).not.toBeChecked();
    expect(immediateRadio).toBeChecked();

    // Click disabled again
    fireEvent.click(disabledRadio);

    expect(disabledRadio).toBeChecked();
    expect(dailyRadio).not.toBeChecked();
    expect(immediateRadio).not.toBeChecked();
  });

  it('handles user authentication state changes', async () => {
    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(
        screen.queryByText('Loading preferences...')
      ).not.toBeInTheDocument();
    });

    // Should load successfully with authenticated user
    expect(screen.getByDisplayValue('disabled')).toBeChecked();

    // Sign out the user (simulating auth state change)
    await apiService.signOut();

    // Change to daily (this should fail due to no auth)
    const dailyRadio = screen.getByDisplayValue('daily');
    fireEvent.click(dailyRadio);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    // Try to save (should fail)
    fireEvent.click(screen.getByText('Save Preferences'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('No authenticated user');
    });
  });
});
