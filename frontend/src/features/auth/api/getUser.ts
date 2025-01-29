import storage from "../../../utils/storage.ts";
import { User } from "../types/types.ts";

export const getUser = async (): Promise<User> => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/profile`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const user = await response.json();
    if (!response.ok) {
      if (response.status === 403) {
        console.warn(
          "Access forbidden: Email not confirmed or insufficient permissions.",
        );
        throw new Error("Access forbidden");
      }
      throw new Error("Failed to fetch user");
    }

    return user;
  } catch (error: any) {
    if (error.message === "Access forbidden") {
      return Promise.reject(error);
    }
    storage.clearToken();
    window.location.reload();
    throw error;
  }
};
