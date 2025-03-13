import { Button, Grid, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { ModalButton } from "../../../components/elements/ModalButton.tsx";
import toast from "react-hot-toast";
import { IFrameGenerator } from "./IFrameGenerator.tsx";
import { RowProps } from "../types/types.ts";
import { useState } from "react";

interface ISnapshotExpendableContent {
  data: RowProps;
  UpdateSnapshot: (snapshotId: number) => void;
  setSnapshotTitle: (projectId: number, title: string) => void;
}

export const SnapshotExpendableContent = ({
  data,
  UpdateSnapshot,
  setSnapshotTitle,
}: ISnapshotExpendableContent) => {
  const { t } = useTranslation();
  const [localTitleState, setLocalTitleState] = useState<string>(
    String(data.data[0]?.value),
  );
  const baseUrl =
    window.location.origin + window.location.pathname.split("/app")[0];
  const snapshotUrl = `${baseUrl}/mirador/${data.snapShotHash}/workspace.json`;

  const handleCopyToClipboard = async () => {
    await navigator.clipboard.writeText(snapshotUrl);
    toast.success(t("toastSuccessSnapshot"));
  };

  const handleUpdateSnapshot = async (
    projectId: number,
    eventValue: string,
  ) => {
    setLocalTitleState(eventValue);
    setSnapshotTitle(projectId, eventValue);
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
            onChange={(e) => handleUpdateSnapshot(data.itemId!, e.target.value)}
            variant="outlined"
            fullWidth
            defaultValue={localTitleState}
          />
        </Grid>
        <Grid item xs>
          <TextField
            label={t("projectSnapshotUrl")}
            value={snapshotUrl}
            disabled
            fullWidth
            helperText={
              data.generatedAt ? `Snapshot taken at ${data.generatedAt}` : null
            }
          />
        </Grid>
      </Grid>
      <Grid item container spacing={1} alignItems="center">
        <Grid item>
          <Button
            color="primary"
            variant="contained"
            onClick={() => UpdateSnapshot(data.id)}
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
          <IFrameGenerator snapshotUrl={snapshotUrl} />
        </Grid>
      </Grid>
    </Grid>
  );
};
