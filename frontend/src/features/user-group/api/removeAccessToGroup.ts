import storage from "../../../utils/storage.ts";

export const removeAccessToGroup = async (groupId: number, userId: number) => {
  try {
    const token = storage.getToken();

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-user-group/remove-access/${groupId}/${userId}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};
