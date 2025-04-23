import { useMutation } from '@tanstack/react-query';

export const useOpenIdLogin = () =>
  useMutation({
    mutationFn: async (accessToken: string) => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/openid-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: accessToken }),
      });

      if (!response.ok) throw new Error('Login failed');

      return response.json();
    },
  });