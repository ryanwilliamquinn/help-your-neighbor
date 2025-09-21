import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateRequestForm from './CreateRequestForm';

describe('CreateRequestForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockUserGroups = [
    {
      id: 'group-1',
      name: 'Test Group',
      createdBy: 'user-1',
      createdAt: new Date('2023-01-01'),
    },
    {
      id: 'group-2',
      name: 'Another Group',
      createdBy: 'user-2',
      createdAt: new Date('2023-01-02'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form fields', () => {
    render(
      <CreateRequestForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userGroups={mockUserGroups}
      />
    );

    expect(screen.getByLabelText(/what do you need/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred store/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/when do you need it by/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/pickup notes/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create request/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CreateRequestForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userGroups={mockUserGroups}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup();
    render(
      <CreateRequestForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userGroups={mockUserGroups}
      />
    );

    await user.click(screen.getByRole('button', { name: /create request/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/item description is required/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/needed by date and time is required/i)
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it.skip('should show error for past date', async () => {
    const user = userEvent.setup();

    render(
      <CreateRequestForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userGroups={mockUserGroups}
      />
    );

    await user.type(screen.getByLabelText(/what do you need/i), 'Test item');

    // Set an hour ago - which should definitely be invalid
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const oneHourAgoString = oneHourAgo.toISOString().slice(0, 16);

    const dateInput = screen.getByLabelText(/when do you need it by/i);
    fireEvent.change(dateInput, { target: { value: oneHourAgoString } });

    await user.click(screen.getByRole('button', { name: /create request/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/needed by date and time must be in the future/i)
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(
      <CreateRequestForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userGroups={mockUserGroups}
      />
    );

    // Get tomorrow's datetime
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // Set to 10 AM
    const tomorrowString = tomorrow.toISOString().slice(0, 16);

    await user.type(
      screen.getByLabelText(/what do you need/i),
      'Milk and bread'
    );
    await user.type(screen.getByLabelText(/preferred store/i), 'Trader Joes');

    const dateInput = screen.getByLabelText(/when do you need it by/i);
    fireEvent.change(dateInput, { target: { value: tomorrowString } });

    await user.type(
      screen.getByLabelText(/pickup notes/i),
      'Any brand is fine'
    );

    await user.click(screen.getByRole('button', { name: /create request/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        itemDescription: 'Milk and bread',
        storePreference: 'Trader Joes',
        neededBy: tomorrowString,
        pickupNotes: 'Any brand is fine',
        groupId: 'group-1',
      });
    });
  });

  it('should clear validation errors when user types', async () => {
    const user = userEvent.setup();
    render(
      <CreateRequestForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userGroups={mockUserGroups}
      />
    );

    // Trigger validation errors
    await user.click(screen.getByRole('button', { name: /create request/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/item description is required/i)
      ).toBeInTheDocument();
    });

    // Start typing to clear error
    await user.type(screen.getByLabelText(/what do you need/i), 'Something');

    await waitFor(() => {
      expect(
        screen.queryByText(/item description is required/i)
      ).not.toBeInTheDocument();
    });
  });

  it('should disable form when submitting', () => {
    render(
      <CreateRequestForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
        userGroups={mockUserGroups}
      />
    );

    expect(screen.getByLabelText(/what do you need/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /creating.../i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });
});
