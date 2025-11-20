import { Button, Grid, styled, Tooltip, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface IReplaceModalContent {
  handleReplaceItem: (
    file: File,
    itemId: number,
    itemName: string,
    hash: string,
  ) => void;
  itemId: number;
  setOpenReplaceModal: (close: boolean) => void;
  itemName: string;
  hash: string;
}

export const ReplaceModalContent = ({
  handleReplaceItem,
  hash,
  itemId,
  itemName,
  setOpenReplaceModal,
}: IReplaceModalContent) => {
  const { t } = useTranslation();

  const onFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleReplaceItem(file, itemId, itemName, hash);
    setOpenReplaceModal(false);
  };

  return (
    <Grid container direction="column" spacing={1}>
      <Typography textAlign="center">{t('replaceWarning')}</Typography>

      <VisuallyHiddenInput
        id="hiddenFileInput"
        type="file"
        onChange={onFileSelect}
      />

      <Grid container justifyContent="center">
        <Tooltip title={t('replaceTooltip')} color="primary">
          <Button
            onClick={() => document.getElementById('hiddenFileInput')?.click()}
            variant="contained"
          >
            <UploadFileIcon />
            {t('selectFile')}
          </Button>
        </Tooltip>
      </Grid>
    </Grid>
  );
};
