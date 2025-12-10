import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import { AppRoutes } from '../routes';

describe('AppRoutes integration', () => {
  it('renders the login page on /auth/login', async () => {
    // simulate navigation
    window.history.pushState({}, 'Login page', '/auth/login');

    renderWithProviders(<AppRoutes />);

    // adapt selectors to your actual login UI
    expect(
      await screen.findByRole('heading', { name: /login/i }),
    ).toBeInTheDocument();
  });
});
