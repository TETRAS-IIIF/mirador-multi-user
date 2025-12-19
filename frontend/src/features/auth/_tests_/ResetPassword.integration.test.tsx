import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/test-utils';
import { ResetPassword } from '../components/resetPassword.tsx';

const resetMutateAsyncMock = vi.fn();

vi.mock('../../../utils/auth', () => ({
  useResetPassword: () => ({
    mutateAsync: resetMutateAsyncMock,
  }),
}));

describe('ResetPassword integration', () => {
  it('shows error and does not submit when reset token is missing', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>,
    );

    const newPasswordInput = await screen.findByLabelText(/^new password\b/i);
    const confirmNewPasswordInput = screen.getByLabelText(
      /^confirm new password\b/i,
    );

    await user.type(newPasswordInput, 'NewStrongPassword123');
    await user.type(confirmNewPasswordInput, 'NewStrongPassword123');

    const submitButton = screen.getByRole('button', {
      name: /reset password/i,
    });

    expect(
      screen.getByText(/invalid or missing reset token/i),
    ).toBeInTheDocument();

    await user.click(submitButton);

    expect(resetMutateAsyncMock).not.toHaveBeenCalled();
  });
});
