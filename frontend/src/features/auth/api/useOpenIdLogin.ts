import { useMutation } from '@tanstack/react-query';
import storage from '../../../utils/storage.ts';

type OpenIdLoginParams = {
  code: string;
  redirectUri: string;
};

type OpenIdLoginResponse = {
  access_token: string;
  id_token?: string;
  expires_in: number;
};

const openIdLogin = async ({ code, redirectUri }: OpenIdLoginParams) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/openid-exchange`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, redirectUri }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'OpenID login failed');
    }
    storage.setToken(data.access_token);
    console.log('data', data);
    return data;
  } catch (err) {
    console.error('❌ OpenID token exchange failed', err);
    throw err;
  }
}

export const useOpenIdLogin = () =>
  useMutation<OpenIdLoginResponse, Error, OpenIdLoginParams>({
    mutationFn: openIdLogin,
  });