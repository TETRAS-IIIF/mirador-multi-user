import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import { AppRoutes } from '../routes';

vi.mock('../../utils/customHooks/useAdminSettings', () => ({
  useAdminSettings: () => ({
    data: {
      mutableSettings: [
        { id: 1, key: 'ALLOW_NEW_USER', value: 'true' },
        { id: 2, key: 'ALLOW_YOUTUBE_MEDIA', value: 'true' },
        { id: 3, key: 'ALLOW_PEERTUBE_MEDIA', value: 'true' },
        { id: 4, key: 'MAX_UPLOAD_SIZE', value: '5000' },
        { id: 6, key: 'OPENID_CONNECTION', value: 'true' },
        { id: 7, key: 'CLASSIC_AUTHENTICATION', value: 'true' },
        { id: 8, key: 'OPEN_ID_CONNECT_ALLOWED', value: '0' },
      ],
      unMutableSettings: [
        ['API_URL', 'http://localhost:3000'],
        ['CADDY_URL', 'http://localhost:9000'],
        ['SWAGGER_URL', 'http://localhost:3000/api'],
        ['BACKEND_LOG_LVL', '2'],
        ['INSTANCE_NAME', 'Mirador Multi User'],
        ['LAST_MIGRATION', '2025-12-01T14:36:09.513Z'],
        ['UPLOAD_FOLDER_SIZE', '12492.80'],
        ['DB_SIZE', '3.59 MB'],
        ['LAST_STARTING_TIME', '2025-12-09T14:01:17.409Z'],
      ],
    },
    isLoading: false,
  }),
}));

describe('AppRoutes integration', () => {
  it('renders the login page on /auth/login', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/login']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const heading = await screen.findByRole('heading', { name: /log in/i });
    expect(heading).toBeInTheDocument();
  });
});
