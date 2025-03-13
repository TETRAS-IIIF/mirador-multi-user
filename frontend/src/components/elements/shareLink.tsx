import { Grid } from "@mui/material";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { SnapShotList } from "../../features/projects/components/SnapShotList.tsx";
import { SnapShot } from "../../features/projects/types/types.ts";

interface IShareLinkProps {
  itemId: number;
  snapShotHash: string;
}

export const ShareLink = ({ itemId, snapShotHash }: IShareLinkProps) => {
  const baseUrl =
    window.location.origin + window.location.pathname.split("/app")[0];
  const [projectSnapshotURL, setProjectSnapshotURL] = useState(
    `${baseUrl}/mirador/${snapShotHash}/workspace.json`,
  );
  const [generatedAt, setGeneratedAt] = useState<null | string>(null);

  const { t } = useTranslation();

  const handleCopyToClipboard = async () => {
    if (generatedAt) {
      await navigator.clipboard.writeText(projectSnapshotURL);
      toast.success(t("toastSuccessSnapshot"));
    } else {
      toast.error(t("toastErrorSnapshot"));
    }
  };

  const fetchManifestInfo = async (hash: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_CADDY_URL}/${hash}/workspace.json`,
      );
      if (!response.ok) throw new Error("Failed to fetch manifest info");
      const miradorWorkspace = await response.json();
      const date = new Date(miradorWorkspace.generated_at);
      const formattedDate = date.toLocaleString();
      setGeneratedAt(formattedDate);
    } catch (error) {
      console.error("Error fetching manifest info:", error);
    }
  };

  useEffect(() => {
    if (projectSnapshotURL) fetchManifestInfo(`${snapShotHash}`);
  }, [projectSnapshotURL]);

  return (
    <Grid container item spacing={2} sx={{ width: "100%" }}>
      <Grid item container xs={10} spacing={2} sx={{ width: "100%" }}>
        <Grid
          container
          item
          flexDirection="row"
          alignItems="center"
          spacing={2}
          sx={{ width: "100%" }}
        >
          <Grid item sx={{ width: "100%" }}>
            <SnapShotList
              snapShots={
                [
                  {
                    title: "dummyTitle",
                    snapShotHash: "randomDummyHash",
                  },
                ] as never[] as SnapShot[]
              }
              handleCopyToClipboard={handleCopyToClipboard}
              itemId={itemId}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};
