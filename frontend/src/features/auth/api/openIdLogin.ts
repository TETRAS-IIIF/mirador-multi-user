import storage from '../../../utils/storage.ts';

type OpenIdLoginParams = {
  code: string;
  redirectUri: string;
};

export const openIdLogin = async ({ code, redirectUri }: OpenIdLoginParams) => {
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
  return data;
};
