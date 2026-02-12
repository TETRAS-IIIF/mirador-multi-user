import storage from '../../../utils/storage.ts';

export const logoutUser = async () => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/logout-url`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || 'Failed to fetch user') as any;

      if (data?.code) {
        error.code = data.code;
      } else {
        error.code = response.status;
      }

      throw error;
    }
    storage.clearToken();
    if (data.url) {
      return (window.location.href = data.url);
    }
    return window.location.reload();
  } catch (error: any) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};
