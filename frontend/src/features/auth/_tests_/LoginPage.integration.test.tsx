import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import { LoginPage } from '../components/LoginPage.tsx';

describe('LoginPage integration', () => {
  it('logs in user when credentials are valid', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/projects/i)).toBeInTheDocument();
  });
});
