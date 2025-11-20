import { Button, Grid, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { ModalButton } from '../../../components/elements/ModalButton.tsx';
import toast from 'react-hot-toast';
import { IFrameGenerator } from './IFrameGenerator.tsx';
import { RowProps } from '../types/types.ts';
import { useState } from 'react';

interface ISnapshotExpendableContent {
  data: RowProps;
  updateSnapshot: (
    snapshotTitle: string,
    projectId: number,
    snapshotId: number,
  ) => void;
  handleDeleteSnapshot: (snapshotId: number, projectId: number) => void;
}

export const SnapshotExpendableContent = ({
  data,
  updateSnapshot,
  handleDeleteSnapshot,
}: ISnapshotExpendableContent) => {
  const { t } = useTranslation();
  const [localTitleState, setLocalTitleState] = useState<string>(
    String(data.data[0]?.value),
  );
  const baseUrl =
    window.location.origin + window.location.pathname.split('/app')[0];
  const snapshotUrl = `${baseUrl}/mirador/${data.snapShotHash}/workspace.json`;

  const handleCopyToClipboard = async () => {
    await navigator.clipboard.writeText(snapshotUrl);
    toast.success(t('toastSuccessSnapshot'));
  };

  const handleUpdateSnapshot = async () => {
    updateSnapshot(localTitleState, data.itemId!, data.snapshotId!);
  };

  const handleUpdateTitle = async (eventValue: string) => {
    setLocalTitleState(eventValue);
  };

  const deleteSnapshot = () => {
    handleDeleteSnapshot(data.snapshotId!, data.itemId!);
  };

  return (
    <Grid container spacing={2} sx={{ padding: 2 }}>
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        flexDirection="row"
        spacing={2}
      >
        <Grid size="grow">
          <TextField
            type="text"
            label={t('title')}
            onChange={(e) => handleUpdateTitle(e.target.value)}
            variant="outlined"
            fullWidth
            defaultValue={localTitleState}
          />
        </Grid>
        <Grid size="grow">
          <TextField
            label={t('projectSnapshotUrl')}
            value={snapshotUrl}
            disabled
            fullWidth
            helperText={
              data.generatedAt ? `Snapshot taken at ${data.generatedAt}` : null
            }
          />
        </Grid>
      </Grid>
      <Grid container spacing={1} alignItems="center">
        <Grid>
          <Button
            color="primary"
            variant="contained"
            onClick={() => handleUpdateSnapshot()}
          >
            {t('update_snapshot')}
          </Button>
        </Grid>
        <Grid>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteSnapshot()}
          >
            {t('delete')}
          </Button>
        </Grid>
        <Grid>
          <ModalButton
            tooltipButton={t('tooltipCopyLink')}
            onClickFunction={handleCopyToClipboard}
            disabled={false}
            icon={<ContentCopyIcon />}
          />
        </Grid>
        <Grid>
          <IFrameGenerator snapshotUrl={snapshotUrl} />
        </Grid>
      </Grid>
    </Grid>
  );
};
