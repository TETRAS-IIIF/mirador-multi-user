import storage from "../../../utils/storage.ts";

export const getAccessToGroup = async (userId: number, groupId: number) => {
  try {
    const token = storage.getToken();
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-user-group/access/${userId}/${groupId}`,
      {
        method: "GET",
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
