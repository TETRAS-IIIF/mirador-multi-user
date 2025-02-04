import storage from "../../../utils/storage.ts";
import { UserGroup } from "../types/types.ts";

export const UpdateGroup = async (
  updateData: Partial<UserGroup>,
): Promise<UserGroup[]> => {
  try {
    const token = storage.getToken();
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-user-group/update-group/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      },
    );
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};
