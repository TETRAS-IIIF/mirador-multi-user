import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/test-utils';
import { RegisterForm } from '../components/RegisterForm';

const registerMutateAsyncMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../utils/auth', () => ({
  useRegister: () => ({
    mutateAsync: registerMutateAsyncMock,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

describe('RegisterForm integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits registration form when data is valid', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    );

    // Wait for form to be rendered and find inputs
    const mailInput = await screen.findByLabelText(/mail/i);
    const nameInput = screen.getByLabelText(/name/i);

    // Find password fields - use more flexible matching
    const passwordInputs = screen.getAllByLabelText(/password/i);
    const passwordInput = passwordInputs[0]; // First one is "Password"
    const confirmPasswordInput = passwordInputs[1]; // Second one is "Confirm Password"

    const submitButton = screen.getByRole('button', {
      name: /submit/i,
    });

    // Verify all inputs are present
    expect(mailInput).toBeInTheDocument();
    expect(nameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();

    // Fill the form with valid data
    await user.type(mailInput, 'new-user@example.com');
    await user.type(nameInput, 'New User');
    await user.type(passwordInput, 'StrongPassword123');
    await user.type(confirmPasswordInput, 'StrongPassword123');

    // Verify inputs have correct values
    expect(mailInput).toHaveValue('new-user@example.com');
    expect(nameInput).toHaveValue('New User');
    expect(passwordInput).toHaveValue('StrongPassword123');
    expect(confirmPasswordInput).toHaveValue('StrongPassword123');

    // Submit the form
    await user.click(submitButton);

    // Assert: register mutation was called with correct data
    await waitFor(() => {
      expect(registerMutateAsyncMock).toHaveBeenCalledTimes(1);

      // Get first call's first argument (the form data)
      const [firstCallArgs] = registerMutateAsyncMock.mock.calls[0];

      expect(firstCallArgs).toEqual(
        expect.objectContaining({
          mail: 'new-user@example.com',
          name: 'New User',
          password: 'StrongPassword123',
          confirmPassword: 'StrongPassword123',
        }),
      );
    });
  });

  it('shows validation errors when passwords do not match', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    );

    const mailInput = await screen.findByLabelText(/mail/i);
    const nameInput = screen.getByLabelText(/name/i);
    const passwordInputs = screen.getAllByLabelText(/password/i);
    const passwordInput = passwordInputs[0];
    const confirmPasswordInput = passwordInputs[1];
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(mailInput, 'user@example.com');
    await user.type(nameInput, 'Test User');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'DifferentPassword123!');
    await user.click(submitButton);

    // Should not call register when passwords don't match
    expect(registerMutateAsyncMock).not.toHaveBeenCalled();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });

    // Try to submit empty form
    await user.click(submitButton);

    // Assert: register mutation was NOT called
    expect(registerMutateAsyncMock).not.toHaveBeenCalled();
  });
});
