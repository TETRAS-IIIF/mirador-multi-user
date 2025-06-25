import storage from '../../../utils/storage.ts';

export const validTerms = async () => {
  try {
    const token = storage.getToken();

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/users/validTerms`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.status;
  } catch (error) {
    console.error('Network error:', error);
    return {
      message: 'email not confirmed',
      status: 500,
    };
  }
};
