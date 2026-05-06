import storage from '../../../utils/storage.ts';

export const initiateImpersonation = async (userId: number) => {
  const token = storage.getToken();

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/impersonate/initiate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId: userId }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to initiate impersonation: ${response.statusText}`,
      );
    }

    const { oidcLogoutUrl } = await response.json();
    window.location.href = oidcLogoutUrl;
  } catch (error) {
    console.error('Failed to initiate impersonation', error);
  }
};

export const handleImpersonationCallback = async (
  token: string,
  userId: number,
) => {
  if (sessionStorage.getItem('impersonation_processing')) return;
  sessionStorage.setItem('impersonation_processing', 'true');

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/impersonate/callback?token=${token}&userId=${userId}`,
      { method: 'GET' },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to exchange impersonation token: ${response.statusText}`,
      );
    }

    const { access_token } = await response.json();

    storage.setToken(access_token);
    storage.setIsImpersonating(true);
    window.location.href = '/app/my-projects';
  } catch (error) {
    console.error('Failed to handle impersonation callback', error);
    sessionStorage.removeItem('impersonation_processing');
  }
};
