export function isKeycloakToken(decoded: any): boolean {
  return decoded?.iss?.includes('keycloak');
}

export const IS_PUBLIC_KEY = 'isPublic';
