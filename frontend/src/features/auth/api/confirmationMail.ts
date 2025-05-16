export const confirmationMail = async (token: string) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/email-confirmation/confirm`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      },
    );
    return await response.json();
  } catch (error) {
    console.error('Network error:', error);
    return {
      message: 'email not confirmed',
      status: 500,
    };
  }
};
