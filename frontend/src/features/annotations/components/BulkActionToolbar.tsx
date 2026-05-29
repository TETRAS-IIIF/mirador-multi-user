import { Box, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { useTranslation } from 'react-i18next';

interface BulkActionToolbarProps {
  selectedCount: number;
  onDownload: () => void;
  onDelete: () => void;
}

export const BulkActionToolbar = ({
  selectedCount,
  onDownload,
  onDelete,
}: BulkActionToolbarProps) => {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <Toolbar
      sx={{
        bgcolor: 'primary.lighter',
        borderRadius: 1,
        display: 'flex',
        justifyContent: 'space-between',
        minHeight: '48px !important',
        px: 2,
      }}
    >
      <Typography variant="subtitle1">
        {selectedCount} {t('annotations.selected')}
      </Typography>
      <Box>
        <Tooltip title={t('annotations.downloadSelected')}>
          <IconButton onClick={onDownload} color="primary">
            <DownloadIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('annotations.deleteSelected')}>
          <IconButton onClick={onDelete} color="error">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Toolbar>
  );
};
