export const mockUser = {
  id: 123,
  mail: 'test@example.com',
  name: 'Test User',
  userGroups: [],
  _isAdmin: false,
  isEmailConfirmed: true,
  lastConnectedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  preferredLanguage: 'en',
  termsValidatedAt: null,
  loginCounter: 1,
};

export const mockUserWithTerms = {
  ...mockUser,
  termsValidatedAt: new Date().toISOString(),
};

export const mockProjects = [
  {
    id: 1,
    title: 'Mon Premier Projet',
    description: 'Description du projet',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ownerId: 123,
    metadata: {},
    shared: false,
    rights: 'WRITE',
  },
];

export const mockPersonalGroup = {
  id: 456,
  name: 'Personal Group',
  description: 'Personal workspace',
  ownerId: 123,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

export const mockManifests = [
  {
    id: 1,
    title: 'Sample Manifest',
    description: 'A sample IIIF manifest',
    hash: 'abc123def456',
    idCreator: 123,
    origin: 'UPLOAD',
    path: '/manifests/sample.json',
    url: 'https://example.com/iiif/manifest.json',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    thumbnailUrl: 'https://example.com/thumbnails/manifest.jpg',
    metadata: {
      author: 'Test Author',
      label: 'Sample Manuscript',
    },
  },
];
export const mockMedia = [
  {
    id: 1,
    name: 'test-image.jpg',
    path: '/media/test-image.jpg',
    type: 'image/jpeg',
    size: 12345,
    userId: 123,
    created_at: '2024-01-01T00:00:00.000Z',
  },
];
