export const mockEnvVars = {
  VITE_OIDC_ISSUER: 'https://mock-oidc-provider.com',
  VITE_OIDC_CLIENT_ID: 'test-client-id',
  VITE_OIDC_REDIRECT_URI: 'http://localhost:4000/oauth/callback',
  VITE_INSTANCE_NAME: 'Mirador Multi User',
  NODE_ENV: 'test',
};

export type MockEnvVars = typeof mockEnvVars;

export const mockAdminSettings = {
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
    ['DB_SIZE', '4.92 MB'],
    ['LAST_STARTING_TIME', '2025-12-23T10:52:57.368Z'],
  ],
};
