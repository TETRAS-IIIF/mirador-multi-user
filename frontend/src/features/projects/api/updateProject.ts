import { ProjectGroupUpdateDto } from "../types/types";
import { fetchBackendAPIConnected } from "../../../utils/fetchBackendAPI.ts";

export const updateProject = async (project: ProjectGroupUpdateDto) => {
  return await fetchBackendAPIConnected(`link-group-project/updateProject`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(project),
  });
};
