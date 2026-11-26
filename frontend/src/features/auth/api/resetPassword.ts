export const resetPassword = async (token: string, password: string) => {
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/auth/reset-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: token, password: password }),
    },
  );
  return response.status === 200;
};
