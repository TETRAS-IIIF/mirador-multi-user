import { useMutation } from '@tanstack/react-query';
import storage from '../../../utils/storage.ts';

type OpenIdLoginParams = {
  code: string;
  redirectUri: string;
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
    if (data.urlConfirmationLink) {
      return window.location.assign(data.urlConfirmationLink);
    }
    storage.setToken(data.access_token);
    return data
  } catch (err) {
    console.error('❌ OpenID token exchange failed', err);
    throw err;
  }
}

export const useOpenIdLogin = () =>
  useMutation({
    mutationFn: openIdLogin,
  });