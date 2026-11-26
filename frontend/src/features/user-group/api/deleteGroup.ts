import storage from "../../../utils/storage.ts";

export const deleteGroup = async (groupId: number) => {
  const token = storage.getToken();
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/link-user-group/group/${groupId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return await response.json();
};
