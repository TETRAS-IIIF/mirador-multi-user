import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/test-utils';
import { LoginForm } from '../components/LoginForm';

const mutateAsyncMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../utils/auth', () => ({
  useLogin: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

describe('LoginPage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs in user when credentials are valid', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    // Wait for form to be rendered
    const mailInput = await screen.findByLabelText(/mail/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    // Verify inputs are present
    expect(mailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();

    // Fill the form
    await user.type(mailInput, 'user@example.com');
    await user.type(passwordInput, 'password123');

    // Verify inputs have correct values
    expect(mailInput).toHaveValue('user@example.com');
    expect(passwordInput).toHaveValue('password123');

    // Submit the form
    await user.click(submitButton);

    // Assert: login mutation was called with correct data
    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledTimes(1);

      // Check first argument (form data)
      expect(mutateAsyncMock).toHaveBeenCalledWith(
        {
          mail: 'user@example.com',
          password: 'password123',
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        }),
      );
    });
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });

    // Try to submit empty form
    await user.click(submitButton);

    // Assert: login mutation was NOT called
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('handles invalid email format', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    const mailInput = await screen.findByLabelText(/mail/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    // Type invalid email
    await user.type(mailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Should not call login with invalid email
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('calls onSuccess callback after successful login', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    const mailInput = await screen.findByLabelText(/mail/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(mailInput, 'user@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    });

    // Get the onSuccess callback and call it to simulate success
    const [[, options]] = mutateAsyncMock.mock.calls;
    if (options?.onSuccess) {
      options.onSuccess();
    }

    // Add assertions for what should happen after successful login
    // e.g., navigation, toast message, etc.
  });
});
