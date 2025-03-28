import { t } from "i18next";
import { fetchBackendAPIConnected } from "../../../../utils/fetchBackendAPI.ts";
import toast from "react-hot-toast";

interface IdtoUpdateSnapshotProps {
  title: string;
  snapshotId: number;
  projectId: number;
}

export const updateSnapshot = async (
  dtoUpdateSnapshot: IdtoUpdateSnapshotProps,
) => {
  return fetchBackendAPIConnected(
    "link-group-project/snapshot/update",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...dtoUpdateSnapshot,
      }),
    },
    () => {
      toast.success(t("snapshotUpdated"));
    },
    () => {
      toast.error(t("saveError"));
    },
  );
};
