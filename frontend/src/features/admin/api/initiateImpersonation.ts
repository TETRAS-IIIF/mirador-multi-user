import storage from "../../../utils/storage.ts";

export const initiateImpersonation = async (userId: number) => {
  const token = storage.getToken();

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/impersonation/${userId}/impersonate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to initiate impersonation: ${response.statusText}`,
      );
    }

    const impersonation = await response.json();
    storage.SetImpersonateUserId(impersonation.user.mail);

    window.open(impersonation.redirectUrl, "_blank");

    window.close();
  } catch (error) {
    console.error("Failed to initiate impersonation", error);
  }
};
