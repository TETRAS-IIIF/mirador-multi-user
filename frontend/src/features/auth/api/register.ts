import { UserResponse } from "../export";

export type RegisterCredentialsDTO = {
  name: string;
  mail: string;
  password: string;
};

export const register = async (
  data: RegisterCredentialsDTO,
): Promise<UserResponse> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-user-group/user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          preferredLanguage: navigator.language.split("-")[0],
        }),
      },
    );
    if (!response.ok) {
      if (response.status === 409) {
        throw new Error("a user with this email or username already exists");
      }
      throw new Error("Failed to create user");
    }
    const user = await response.json();
    return user;
  } catch (error) {
    throw error;
  }
};
