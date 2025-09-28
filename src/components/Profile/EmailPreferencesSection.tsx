import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks';
import { apiService } from '@/services';
import type { EmailPreferences, EmailPreferencesForm } from '@/types';

interface EmailPreferencesSectionProps {
  className?: string;
}

const EmailPreferencesSection: React.FC<EmailPreferencesSectionProps> = ({
  className,
}) => {
  const toast = useToast();
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [formData, setFormData] = useState<EmailPreferencesForm>({
    frequency: 'disabled',
  });
  const [originalFormData, setOriginalFormData] =
    useState<EmailPreferencesForm>({
      frequency: 'disabled',
    });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEmailPreferences();
  }, []);

  const loadEmailPreferences = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const prefs = await apiService.getEmailPreferences();
      setPreferences(prefs);
      const formPrefs = { frequency: prefs.frequency };
      setFormData(formPrefs);
      setOriginalFormData(formPrefs);
    } catch (error) {
      console.error('Failed to load email preferences:', error);
      toast.error('Failed to load email preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFrequencyChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const frequency = e.target.value as 'disabled' | 'daily' | 'immediate';
    setFormData({ frequency });
  };

  const hasChanges = (): boolean => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData);
  };

  const handleCancel = (): void => {
    setFormData(originalFormData);
  };

  const handleSave = async (): Promise<void> => {
    if (!hasChanges()) {
      toast.error('No changes to save');
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedPrefs = await apiService.updateEmailPreferences(formData);
      setPreferences(updatedPrefs);
      setOriginalFormData(formData);
      toast.success('Email preferences updated successfully');
    } catch (error) {
      console.error('Failed to update email preferences:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update email preferences'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`email-preferences-section ${className || ''}`}>
        <h3>Email Notifications</h3>
        <p>Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className={`email-preferences-section ${className || ''}`}>
      <div className="form-section-header">
        <h3>Email Notifications</h3>
        <p className="section-subtitle">
          Choose how often you'd like to receive email notifications about new
          requests
        </p>
      </div>

      <div className="email-preferences-form">
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="frequency"
              value="disabled"
              checked={formData.frequency === 'disabled'}
              onChange={handleFrequencyChange}
              disabled={isSubmitting}
            />
            <div className="radio-content">
              <span className="radio-label">Never</span>
              <span className="radio-description">
                Don't send me any email notifications
              </span>
            </div>
          </label>

          <label className="radio-option">
            <input
              type="radio"
              name="frequency"
              value="daily"
              checked={formData.frequency === 'daily'}
              onChange={handleFrequencyChange}
              disabled={isSubmitting}
            />
            <div className="radio-content">
              <span className="radio-label">Daily Summary</span>
              <span className="radio-description">
                Send me a daily email with all open requests (8 AM)
              </span>
            </div>
          </label>

          <label className="radio-option">
            <input
              type="radio"
              name="frequency"
              value="immediate"
              checked={formData.frequency === 'immediate'}
              onChange={handleFrequencyChange}
              disabled={isSubmitting}
            />
            <div className="radio-content">
              <span className="radio-label">Immediate Notifications</span>
              <span className="radio-description">
                Send me an email immediately when new requests are posted
              </span>
            </div>
          </label>
        </div>

        {preferences?.lastDailySent && formData.frequency === 'daily' && (
          <div className="email-info">
            <p className="last-sent-info">
              Last daily email sent:{' '}
              {new Date(preferences.lastDailySent).toLocaleDateString()} at{' '}
              {new Date(preferences.lastDailySent).toLocaleTimeString()}
            </p>
          </div>
        )}

        {hasChanges() && (
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailPreferencesSection;
