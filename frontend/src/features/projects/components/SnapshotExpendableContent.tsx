import { Button, Grid, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import { generateSnapshot } from "../api/generateProjectSnapShot.ts";
import { useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { ModalButton } from "../../../components/elements/ModalButton.tsx";
import toast from "react-hot-toast";
import { IFrameGenerator } from "./IFrameGenerator.tsx";
import { RowProps } from "../types/types.ts";

export const SnapshotExpendableContent = (data: RowProps) => {
  const { t } = useTranslation();
  console.log("data", data);
  const baseUrl =
    window.location.origin + window.location.pathname.split("/app")[0];
  const [projectSnapshotURL, setProjectSnapshotURL] = useState(
    `${baseUrl}/mirador/${data.snapShotHash}/workspace.json`,
  );
  const [generatedAt, setGeneratedAt] = useState<null | string>(null);

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
  const handleGenerateSnapshot = async () => {
    const snapShotUrl = await generateSnapshot(data.itemId!);
    fetchManifestInfo(snapShotUrl.snapShotHash);
    setProjectSnapshotURL(
      `${baseUrl}/mirador/${snapShotUrl.snapShotHash}/workspace.json`,
    );
  };

  const handleCopyToClipboard = async () => {
    if (generatedAt) {
      await navigator.clipboard.writeText(projectSnapshotURL);
      toast.success(t("toastSuccessSnapshot"));
    } else {
      toast.error(t("toastErrorSnapshot"));
    }
  };

  return (
    <Grid item container spacing={2} sx={{ padding: 1 }}>
      <Grid
        item
        container
        justifyContent="space-between"
        alignItems="center"
        flexDirection="row"
        spacing={2}
      >
        <Grid item xs>
          <TextField
            type="text"
            label={t("title")}
            onChange={() => console.log("toto")}
            variant="outlined"
            fullWidth
            defaultValue={String(data.data[0]?.value || "")}
          />
        </Grid>
        <Grid item xs>
          <TextField
            label={t("projectSnapshotUrl")}
            value={projectSnapshotURL}
            disabled
            fullWidth
            helperText={generatedAt ? `Snapshot taken at ${generatedAt}` : null}
          />
        </Grid>
      </Grid>
      <Grid item container spacing={1} alignItems="center">
        <Grid item>
          <Button
            color="primary"
            variant="contained"
            onClick={handleGenerateSnapshot}
          >
            {t("generate_snapshot")}
          </Button>
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
          <IFrameGenerator snapshotUrl={projectSnapshotURL} />
        </Grid>
      </Grid>
    </Grid>
  );
};
