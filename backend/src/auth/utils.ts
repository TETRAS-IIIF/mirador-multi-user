export const PASSWORD_MINIMUM_LENGTH = 16;

export type OpenIDUser = {
  claims: {
    sub: string;
    email: string;
    email_verified?: boolean;
    name?: string;
    preferred_username?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    locale?: string;
    updated_at?: number;
    [key: string]: any;
  };
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
};
