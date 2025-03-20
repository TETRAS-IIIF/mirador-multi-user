import { Grid, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { ModalButton } from "./ModalButton.tsx";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { generateSnapShotUrl } from "../../features/projects/api/generateProjectSnapShot.ts";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { IFrameGenerator } from "../../features/projects/components/IFrameGenerator.tsx";

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

  const handleGenerateSnapshot = async () => {
    const snapShotUrl = await generateSnapShotUrl(itemId);
    fetchManifestInfo(snapShotUrl.snapShotHash);
    setProjectSnapshotURL(
      `${baseUrl}/mirador/${snapShotUrl.snapShotHash}/workspace.json`,
    );
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
    <Grid container item spacing={2}>
      <Grid item container xs={10} spacing={2} sx={{ width: "100%" }}>
        <Grid
          container
          item
          flexDirection="row"
          alignItems="center"
          spacing={2}
          sx={{ width: "100%" }}
        >
          {projectSnapshotURL && (
            <>
              <Grid item xs={8}>
                <TextField
                  inputProps={{
                    maxLength: 255,
                  }}
                  label={t("projectSnapshotUrl")}
                  value={projectSnapshotURL}
                  disabled
                  fullWidth
                  helperText={
                    generatedAt ? `Snapshot taken at ${generatedAt}` : null
                  }
                />
              </Grid>
              <Grid item>
                <ModalButton
                  tooltipButton={t("tooltipCopyLink")}
                  onClickFunction={handleCopyToClipboard}
                  disabled={false}
                  icon={<ContentCopyIcon />}
                />
              </Grid>
              <Grid item>
                <ModalButton
                  disabled={false}
                  icon={<RotateRightIcon />}
                  onClickFunction={handleGenerateSnapshot}
                  tooltipButton={t("tooltipSnapshotButton")}
                />
              </Grid>
            </>
          )}
          <Grid item>
            <IFrameGenerator snapshotUrl={projectSnapshotURL} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};
