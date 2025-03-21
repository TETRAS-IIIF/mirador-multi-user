import { ProjectGroupUpdateDto } from "../../types/types.ts";
import { fetchBackendAPIConnected } from "../../../../utils/fetchBackendAPI.ts";
import toast from "react-hot-toast";
import { t } from "i18next";

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
      toast.success(t("projectSaved", { projectTitle: project.project.title }));
    },
    () => {
      toast.error(
        t("projectSavedFailed", { projectTitle: project.project.title }),
      );
    },
  );
};
