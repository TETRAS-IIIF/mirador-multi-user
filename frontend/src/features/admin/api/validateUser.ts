import storage from '../../../utils/storage.ts';

export const validateUser = async (
  userId: number,
) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-user-group/validate-user/${userId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const responseJson = await response.json();

    const { access_token } = responseJson;
    if (!token) {
      console.error('token is undefined', token);
    }

    return access_token;
  } catch (error) {
    console.error('Failed to validate impersonation', error);
  }
};
