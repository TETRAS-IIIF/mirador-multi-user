import storage from "../../../utils/storage.ts";

export const deleteAccount = async (userId: number) => {
  try {
    const token = storage.getToken();
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/user-management/delete/${userId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.status === 200;
  } catch (error) {
    throw error;
  }
};
