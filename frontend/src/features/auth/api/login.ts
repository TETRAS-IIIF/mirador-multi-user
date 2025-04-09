import { UserResponse } from "../types/types.ts";
import toast from "react-hot-toast";
import storage from "../../../utils/storage.ts";
import { t } from "i18next";

export type LoginCredentialsDTO = {
  mail: string;
  password: string;
  isImpersonate?: string;
};

export const login = async (
  data: LoginCredentialsDTO,
): Promise<UserResponse> => {
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cache-control": "no-store",
        pragma: "no-cache",
      },
      body: JSON.stringify(data),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    toast.error(t("userLoginFailed"));
    throw new Error("Failed to log user");
  }

  const { access_token } = await response.json();
  const profileResponse = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/auth/profile`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    },
  );
  const profile = await profileResponse.json();
  if (profile.statusCode === 403) {
    storage.setUserEmail(data.mail);
  }
  return {
    user: profile,
    access_token: access_token,
  };
};
