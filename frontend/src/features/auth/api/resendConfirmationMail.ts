import storage from '../../../utils/storage.ts';

export const ResendConfirmationMail = async (
  email: string,
  language: string,
) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-user-group/resend-confirmation-link/${email}/${language}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    storage.clearToken();
    return response.status;
  } catch (error) {
    console.error('Network error:', error);
  }
};
