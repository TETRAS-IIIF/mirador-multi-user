import storage from "../../../utils/storage.ts";

export const impersonateUser = async (
  impersonateToken: string,
  userId: number,
) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/impersonation/impersonate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: impersonateToken, userId: userId }),
      },
    );

    const responseJson = await response.json();

    const { access_token } = responseJson;
    if (!token) {
      console.error("token is undefined", token);
    }

    return access_token;
  } catch (error) {
    console.error("Failed to validate impersonation", error);
  }
};
