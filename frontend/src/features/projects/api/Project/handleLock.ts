import { LockProjectDto } from "../../types/types.ts";
import { fetchBackendAPIConnected } from "../../../../utils/fetchBackendAPI.ts";

export const handleLock = async (lockProjectDto: LockProjectDto) => {
  return await fetchBackendAPIConnected(`link-group-project/project/lock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...lockProjectDto }),
  });
};
