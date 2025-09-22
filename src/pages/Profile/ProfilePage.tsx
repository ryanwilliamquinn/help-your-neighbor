import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '@/hooks';
import type { UserProfileForm } from '@/types';
import './ProfilePage.css';

const ProfilePage = (): React.JSX.Element => {
  const { user, loading, updateUserProfile } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfileForm>({
    name: '',
    phone: '',
    generalArea: '',
  });
  const [originalProfile, setOriginalProfile] = useState<UserProfileForm>({
    name: '',
    phone: '',
    generalArea: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<UserProfileForm>>({});

  useEffect(() => {
    if (user) {
      const profileData = {
        name: user.name || '',
        phone: user.phone || '',
        generalArea: user.generalArea || '',
      };
      setProfile(profileData);
      setOriginalProfile(profileData);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { id, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [id]: value,
    }));

    // Clear error when user starts typing
    if (errors[id as keyof UserProfileForm]) {
      setErrors((prev) => ({
        ...prev,
        [id]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<UserProfileForm> = {};

    if (!profile.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (profile.phone && !/^\+?[\d\s\-()]+$/.test(profile.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = (): boolean => {
    return JSON.stringify(profile) !== JSON.stringify(originalProfile);
  };

  const handleCancel = (): void => {
    setProfile(originalProfile);
    setErrors({});
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!hasChanges()) {
      toast.error('No changes to save');
      return;
    }

    setIsSubmitting(true);

    try {
      if (updateUserProfile) {
        await updateUserProfile(profile);
        setOriginalProfile(profile); // Update the original to reflect the new saved state
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-page">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="no-user-page">Please log in to view your profile.</div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1>Profile Settings</h1>
        <p className="profile-subtitle">Update your personal information</p>
      </header>

      <div className="profile-form">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              value={profile.name}
              onChange={handleChange}
              disabled={isSubmitting}
              className={errors.name ? 'error' : ''}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <span
                className="error-message"
                style={{ marginTop: '0.5rem', display: 'block' }}
              >
                {errors.name}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={profile.phone}
              onChange={handleChange}
              disabled={isSubmitting}
              className={errors.phone ? 'error' : ''}
              placeholder="(555) 123-4567"
            />
            {errors.phone && (
              <span
                className="error-message"
                style={{ marginTop: '0.5rem', display: 'block' }}
              >
                {errors.phone}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="generalArea">General Area</label>
            <input
              type="text"
              id="generalArea"
              value={profile.generalArea}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g., Downtown, Mission District, etc."
            />
          </div>

          <div className="form-actions">
            {hasChanges() && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !hasChanges()}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
