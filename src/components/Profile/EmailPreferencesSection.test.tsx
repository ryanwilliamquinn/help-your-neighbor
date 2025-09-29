import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailPreferencesSection from './EmailPreferencesSection';
import { useToast } from '@/hooks';
import { apiService } from '@/services';
import type { EmailPreferences } from '@/types';

// Mock the hooks and services
jest.mock('@/hooks', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/services', () => ({
  apiService: {
    getEmailPreferences: jest.fn(),
    updateEmailPreferences: jest.fn(),
  },
}));

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

const mockPreferences: EmailPreferences = {
  userId: 'user-1',
  frequency: 'disabled',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('EmailPreferencesSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue(mockToast);
    (apiService.getEmailPreferences as jest.Mock).mockResolvedValue(
      mockPreferences
    );
  });

  it('renders loading state initially', async () => {
    render(<EmailPreferencesSection />);

    expect(screen.getByText('Loading preferences...')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByText('Loading preferences...')
      ).not.toBeInTheDocument();
    });
  });

  it('renders email preferences form after loading', async () => {
    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(
        screen.getByText(
          "Choose how often you'd like to receive email notifications about new requests"
        )
      ).toBeInTheDocument();
    });

    // Check that all frequency options are present
    expect(screen.getByLabelText(/Never/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Daily Summary/)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Immediate Notifications/)
    ).toBeInTheDocument();
  });

  it('loads and displays current preferences', async () => {
    const prefsWithDaily: EmailPreferences = {
      ...mockPreferences,
      frequency: 'daily',
    };
    (apiService.getEmailPreferences as jest.Mock).mockResolvedValue(
      prefsWithDaily
    );

    render(<EmailPreferencesSection />);

    await waitFor(() => {
      const dailyRadio = screen.getByDisplayValue('daily');
      expect(dailyRadio).toBeChecked();
    });
  });

  it('shows form actions when changes are made', async () => {
    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('disabled')).toBeChecked();
    });

    // Initially no form actions should be visible
    expect(screen.queryByText('Save Preferences')).not.toBeInTheDocument();

    // Change to daily
    const dailyRadio = screen.getByDisplayValue('daily');
    fireEvent.click(dailyRadio);

    // Form actions should now be visible
    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('handles frequency change correctly', async () => {
    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('disabled')).toBeChecked();
    });

    // Change to immediate notifications
    const immediateRadio = screen.getByDisplayValue('immediate');
    fireEvent.click(immediateRadio);

    expect(immediateRadio).toBeChecked();
    expect(screen.getByDisplayValue('disabled')).not.toBeChecked();
  });

  it('cancels changes when cancel button is clicked', async () => {
    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('disabled')).toBeChecked();
    });

    // Make a change
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
  });

  it('saves preferences successfully', async () => {
    const updatedPrefs: EmailPreferences = {
      ...mockPreferences,
      frequency: 'daily',
      updatedAt: new Date(),
    };
    (apiService.updateEmailPreferences as jest.Mock).mockResolvedValue(
      updatedPrefs
    );

    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('disabled')).toBeChecked();
    });

    // Change to daily
    const dailyRadio = screen.getByDisplayValue('daily');
    fireEvent.click(dailyRadio);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    // Click save
    fireEvent.click(screen.getByText('Save Preferences'));

    await waitFor(() => {
      expect(apiService.updateEmailPreferences).toHaveBeenCalledWith({
        frequency: 'daily',
      });
      expect(mockToast.success).toHaveBeenCalledWith(
        'Email preferences updated successfully'
      );
    });

    // Form actions should be hidden after successful save
    expect(screen.queryByText('Save Preferences')).not.toBeInTheDocument();
  });

  it('handles save error gracefully', async () => {
    const error = new Error('Failed to update preferences');
    (apiService.updateEmailPreferences as jest.Mock).mockRejectedValue(error);

    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('disabled')).toBeChecked();
    });

    // Change to daily
    const dailyRadio = screen.getByDisplayValue('daily');
    fireEvent.click(dailyRadio);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    // Click save
    fireEvent.click(screen.getByText('Save Preferences'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to update preferences'
      );
    });
  });

  it('prevents saving when no changes are made', async () => {
    // Set up successful update mock for this test
    const updatedPrefs: EmailPreferences = {
      ...mockPreferences,
      frequency: 'daily',
      updatedAt: new Date(),
    };
    (apiService.updateEmailPreferences as jest.Mock).mockResolvedValue(
      updatedPrefs
    );

    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('disabled')).toBeChecked();
    });

    // Initially no save button should be visible since no changes
    expect(screen.queryByText('Save Preferences')).not.toBeInTheDocument();

    // Make a change to enable save button
    const dailyRadio = screen.getByDisplayValue('daily');
    fireEvent.click(dailyRadio);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    // Save the changes
    fireEvent.click(screen.getByText('Save Preferences'));

    // Wait for save to complete and form actions to disappear
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        'Email preferences updated successfully'
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Save Preferences')).not.toBeInTheDocument();
    });
  });

  it('displays last daily sent information when available', async () => {
    const prefsWithLastSent: EmailPreferences = {
      ...mockPreferences,
      frequency: 'daily',
      lastDailySent: new Date('2024-01-15T08:00:00Z'),
    };
    (apiService.getEmailPreferences as jest.Mock).mockResolvedValue(
      prefsWithLastSent
    );

    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('daily')).toBeChecked();
    });

    // Should show last sent info
    expect(screen.getByText(/Last daily email sent:/)).toBeInTheDocument();
  });

  it('handles loading error gracefully', async () => {
    const error = new Error('Failed to load preferences');
    (apiService.getEmailPreferences as jest.Mock).mockRejectedValue(error);

    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to load email preferences'
      );
    });
  });

  it('shows loading state during save operation', async () => {
    // Make the update take some time
    (apiService.updateEmailPreferences as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockPreferences), 100)
        )
    );

    render(<EmailPreferencesSection />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('disabled')).toBeChecked();
    });

    // Change to daily
    const dailyRadio = screen.getByDisplayValue('daily');
    fireEvent.click(dailyRadio);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    // Click save
    fireEvent.click(screen.getByText('Save Preferences'));

    // Should show saving state
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });
});
