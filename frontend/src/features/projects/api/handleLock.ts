import { LockProjectDto } from "../types/types.ts";
import storage from "../../../utils/storage.ts";

export const handleLock = async (lockProjectDto: LockProjectDto) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-group-project/project/lock`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...lockProjectDto }),
      },
    );
    const toreturn = await response.json();
    return toreturn;
  } catch (error) {
    throw error;
  }
};
