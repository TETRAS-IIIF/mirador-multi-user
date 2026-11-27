import { assertEnv, checkEnv, REQUIRED_ENV } from './check-env';

const complete = {
  DB_HOST: 'db',
  DB_USER: 'mmu',
  DB_PASS: 'secret-pass',
  DB_DATABASE: 'mmu',
  JWT_SECRET: 'secret-jwt',
  JWT_EMAIL_VERIFICATION_TOKEN_SECRET: 'secret-mail',
  SMTP_DOMAIN: 'smtp.example.org',
};

describe('checkEnv', () => {
  it('accepts a complete environment', () => {
    expect(checkEnv(complete)).toEqual({ errors: [], warnings: [] });
  });

  it('names every missing or blank required variable', () => {
    const { errors } = checkEnv({
      ...complete,
      DB_PASS: '  ',
      JWT_SECRET: undefined,
    });
    expect(errors).toEqual(['DB_PASS is not set', 'JWT_SECRET is not set']);
    expect(checkEnv({}).errors).toHaveLength(REQUIRED_ENV.length);
  });

  it('warns about features that would fail later', () => {
    const { errors, warnings } = checkEnv({
      ...complete,
      JWT_EMAIL_VERIFICATION_TOKEN_SECRET: '',
      SMTP_DOMAIN: '',
      OPENID_CONNECTION: 'true',
      OIDC_ISSUER: 'https://sso.example.org/realms/mmu',
    });
    expect(errors).toEqual([]);
    expect(warnings.map((w) => w.split(' ')[0])).toEqual([
      'JWT_EMAIL_VERIFICATION_TOKEN_SECRET',
      'OIDC_CLIENT_ID',
      'OIDC_CLIENT_SECRET',
      'OIDC_REDIRECT_URI',
      'SMTP_DOMAIN',
    ]);
    // OIDC settings are only needed when OpenID login is on.
    expect(
      checkEnv({ ...complete, OPENID_CONNECTION: 'false' }).warnings,
    ).toEqual([]);
  });

  it('never reports a value', () => {
    const { errors, warnings } = checkEnv({
      ...complete,
      JWT_SECRET: '',
      JWT_EMAIL_VERIFICATION_TOKEN_SECRET: '',
    });
    const text = [...errors, ...warnings].join(' ');
    for (const value of ['secret-pass', 'secret-mail', 'secret-jwt']) {
      expect(text).not.toContain(value);
    }
  });
});

describe('assertEnv', () => {
  it('exits with the list of missing variables', () => {
    const log = { warn: jest.fn(), error: jest.fn() };
    const exit = jest.fn() as unknown as (code: number) => never;
    assertEnv({ ...complete, DB_HOST: '' }, log, exit);
    expect(exit).toHaveBeenCalledWith(1);
    expect(log.error.mock.calls[0][0]).toContain('DB_HOST is not set');
  });

  it('only warns when the required variables are there', () => {
    const log = { warn: jest.fn(), error: jest.fn() };
    const exit = jest.fn() as unknown as (code: number) => never;
    assertEnv({ ...complete, SMTP_DOMAIN: '' }, log, exit);
    expect(exit).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      expect.stringContaining('SMTP_DOMAIN'),
    );
  });
});
