import React, { useState } from 'react';
import type {
  CreateRequestForm as CreateRequestFormData,
  Group,
} from '@/types';
import './CreateRequestForm.css';

interface CreateRequestFormProps {
  onSubmit: (requestData: CreateRequestFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  userGroups: Group[];
}

const CreateRequestForm = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  userGroups,
}: CreateRequestFormProps): React.JSX.Element => {
  const [formData, setFormData] = useState<CreateRequestFormData>({
    itemDescription: '',
    storePreference: '',
    neededBy: '',
    pickupNotes: '',
    groupId: userGroups.length > 0 ? userGroups[0].id : '',
  });
  const [errors, setErrors] = useState<Partial<CreateRequestFormData>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof CreateRequestFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateRequestFormData> = {};

    if (!formData.itemDescription.trim()) {
      newErrors.itemDescription = 'Item description is required';
    }

    if (!formData.groupId) {
      newErrors.groupId = 'Please select a group';
    }

    if (!formData.neededBy) {
      newErrors.neededBy = 'Needed by date and time is required';
    } else {
      const neededByDate = new Date(formData.neededBy);
      const now = new Date();
      if (neededByDate <= now) {
        newErrors.neededBy = 'Needed by date and time must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    console.log('Form data before validation:', formData);
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      return;
    }

    console.log('Submitting form data:', formData);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Get minimum datetime for needed by (tomorrow)
  const getMinDateTime = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  return (
    <div className="create-request-form-overlay">
      <div className="create-request-form-container">
        <div className="form-header">
          <h2>Create New Request</h2>
          <p>Let your group know what you need help picking up</p>
        </div>

        <form onSubmit={handleSubmit} className="create-request-form">
          <div className="form-group">
            <label htmlFor="groupId">Post to which group? *</label>
            <select
              id="groupId"
              name="groupId"
              value={formData.groupId}
              onChange={handleChange}
              disabled={isSubmitting || userGroups.length === 0}
              className={errors.groupId ? 'error' : ''}
            >
              {userGroups.length === 0 ? (
                <option value="">No groups available</option>
              ) : (
                <>
                  <option value="">Select a group...</option>
                  {userGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.groupId && (
              <span className="error-message">{errors.groupId}</span>
            )}
            {userGroups.length === 0 && (
              <div className="info-message">
                You need to join a group before you can create requests.
                <a href="/groups" style={{ marginLeft: '5px' }}>
                  View Groups
                </a>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="itemDescription">What do you need? *</label>
            <textarea
              id="itemDescription"
              name="itemDescription"
              value={formData.itemDescription}
              onChange={handleChange}
              placeholder="e.g., 1 gallon of milk, bananas, bread..."
              rows={3}
              disabled={isSubmitting}
              className={errors.itemDescription ? 'error' : ''}
            />
            {errors.itemDescription && (
              <span className="error-message">{errors.itemDescription}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="storePreference">Preferred store (optional)</label>
            <input
              type="text"
              id="storePreference"
              name="storePreference"
              value={formData.storePreference}
              onChange={handleChange}
              placeholder="e.g., Trader Joe's, Safeway, CVS..."
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="neededBy">When do you need it by? *</label>
            <input
              type="datetime-local"
              id="neededBy"
              name="neededBy"
              value={formData.neededBy}
              onChange={handleChange}
              min={getMinDateTime()}
              disabled={isSubmitting}
              className={errors.neededBy ? 'error' : ''}
            />
            {errors.neededBy && (
              <span className="error-message">{errors.neededBy}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="pickupNotes">Pickup notes (optional)</label>
            <textarea
              id="pickupNotes"
              name="pickupNotes"
              value={formData.pickupNotes}
              onChange={handleChange}
              placeholder="Any special instructions, brand preferences, payment method, etc."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequestForm;
