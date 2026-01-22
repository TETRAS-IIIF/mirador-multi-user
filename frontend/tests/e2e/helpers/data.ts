export const mockUser = {
  id: 123,
  mail: 'test@example.com',
  name: 'Test User',
  userGroups: [],
  _isAdmin: false,
  isEmailConfirmed: true,
  createdAt: new Date().toISOString(),
  lastConnectedAt: new Date().toISOString(),
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
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    lockedAt: null,
    lockedByUserId: null,
    metadata: {},
    noteTemplate: [],
    snapShots: [],
    tags: [],
    thumbnailUrl: undefined,
    owner: mockUser,
    shared: false,
    rights: 'WRITE',
    userWorkspace: {},
  },
];

export const mockPersonalGroup = { id: 1 };
export const mockManifests = [];
export const mockMedia = [];
