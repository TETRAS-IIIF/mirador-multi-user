export const forgotPassword = async (email: string) => {
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/auth/forgot-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email }),
    },
  );
  return response.status === 200;
};
