/**
 * Environment variables the backend needs, checked once at startup so that
 * a missing one is named right away instead of failing later.
 * Only names are ever reported, never values.
 */

/** Without these nothing works: the backend refuses to start. */
export const REQUIRED_ENV = [
  'DB_HOST',
  'DB_USER',
  'DB_PASS',
  'DB_DATABASE',
  'JWT_SECRET',
] as const;

type Env = Record<string, string | undefined>;

const isSet = (env: Env, key: string) => (env[key] ?? '').trim() !== '';

/** Names of the variables that are missing or empty, by severity. */
export function checkEnv(env: Env): { errors: string[]; warnings: string[] } {
  const errors = REQUIRED_ENV.filter((key) => !isSet(env, key)).map(
    (key) => `${key} is not set`,
  );
  const warnings: string[] = [];
  if (!isSet(env, 'JWT_EMAIL_VERIFICATION_TOKEN_SECRET')) {
    warnings.push(
      'JWT_EMAIL_VERIFICATION_TOKEN_SECRET is not set: e-mail confirmation and password reset will fail',
    );
  }
  if (env.OPENID_CONNECTION === 'true') {
    for (const key of [
      'OIDC_ISSUER',
      'OIDC_CLIENT_ID',
      'OIDC_CLIENT_SECRET',
      'OIDC_REDIRECT_URI',
    ]) {
      if (!isSet(env, key)) {
        warnings.push(
          `${key} is not set although OPENID_CONNECTION=true: OpenID login will fail`,
        );
      }
    }
  }
  if (!isSet(env, 'SMTP_DOMAIN')) {
    warnings.push('SMTP_DOMAIN is not set: no e-mail will be sent');
  }
  return { errors, warnings };
}

/**
 * Logs the warnings and, when something required is missing, exits with a
 * message naming every missing variable.
 */
export function assertEnv(
  env: Env = process.env,
  log: Pick<Console, 'warn' | 'error'> = console,
  exit: (code: number) => never = process.exit,
) {
  const { errors, warnings } = checkEnv(env);
  warnings.forEach((w) => log.warn(`[env] ${w}`));
  if (errors.length > 0) {
    log.error(
      `[env] The backend cannot start:\n${errors.map((e) => `  - ${e}`).join('\n')}\n` +
        'Set them in .env (see ENVIRONMENT.md), then restart.',
    );
    exit(1);
  }
}
