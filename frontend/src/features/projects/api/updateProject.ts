import { ProjectGroupUpdateDto } from "../types/types";
import { fetchBackendAPIConnected } from "../../../utils/fetchBackendAPI.ts";
import toast from "react-hot-toast";

export const updateProject = async (project: ProjectGroupUpdateDto) => {
  return await fetchBackendAPIConnected(
    `link-group-project/updateProject`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(project),
    },
    () => {
      toast.success(`Project ${project.project.title} saved`); // TODO Trad
    },
    () => {
      toast.error(`Failed to save ${project.project.title}`); // TODO Trad
    },
  );
};
