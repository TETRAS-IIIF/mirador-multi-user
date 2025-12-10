import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/test-utils';
import { LoginForm } from '../components/LoginForm';

const mutateAsyncMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../utils/auth', () => ({
  useLogin: () => ({
    mutateAsync: mutateAsyncMock,
  }),
}));

describe('LoginPage integration', () => {
  it('logs in user when credentials are valid', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    // Labels are "Mail" and "Password" in your DOM
    const mailInput = await screen.findByLabelText(/mail/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(mailInput, 'user@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Assert: submit button still rendered (sanity check)
    expect(submitButton).toBeInTheDocument();

    // Assert: login mutation was called once
    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
  });
});
