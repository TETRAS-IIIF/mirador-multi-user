import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/test-utils';
import { RegisterForm } from '../components/RegisterForm';

const registerMutateAsyncMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../utils/auth', () => ({
  useRegister: () => ({
    mutateAsync: registerMutateAsyncMock,
  }),
}));

describe('SignInPage integration', () => {
  it('submits sign in form when data is valid', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    );

    const mailInput = await screen.findByLabelText(/mail/i);
    const nameInput = screen.getByLabelText(/name/i);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(mailInput, 'new-user@example.com');
    await user.type(nameInput, 'New User');
    await user.type(passwordInput, 'StrongPassword123');
    await user.type(confirmPasswordInput, 'StrongPassword123');

    const submitButton = screen.getByRole('button', {
      name: /submit|register|sign ?up|sign ?in/i,
    });

    await user.click(submitButton);

    expect(submitButton).toBeInTheDocument();

    expect(registerMutateAsyncMock).toHaveBeenCalledTimes(1);
    expect(registerMutateAsyncMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mail: 'new-user@example.com',
        name: 'New User',
      }),
      expect.any(Object),
    );
  });
});
