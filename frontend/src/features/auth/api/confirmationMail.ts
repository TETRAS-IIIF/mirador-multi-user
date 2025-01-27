type ConfirmMailResponse = {
  message: string;
  status: number;
};

export const confirmationMail = async (
  token: string,
): Promise<ConfirmMailResponse> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/email-confirmation/confirm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      },
    );
    if (response.status === 201) {
      return {
        message: "email confirmed",
        status: response.status,
      };
    } else {
      console.error("Unexpected status:", response.status, response.statusText);
      return {
        message: "Email not confirmed",
        status: response.status,
      };
    }
  } catch (error) {
    console.error("Network error:", error);
    return {
      message: "email not confirmed",
      status: 500,
    };
  }
};
