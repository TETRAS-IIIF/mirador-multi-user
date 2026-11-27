import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ModalProjectAlreadyOpenByUserProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const ModalProjectAlreadyOpenByUser = ({
  onConfirm,
  onCancel,
}: ModalProjectAlreadyOpenByUserProps) => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('projectLockedByYouTitle')}
      </Typography>

      <Typography sx={{ mb: 3 }}>{t('projectLockedByYouInfo')}</Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel}>{t('cancel')}</Button>
        <Button variant="contained" color="error" onClick={onConfirm}>
          {t('reopenProject')}
        </Button>
      </Box>
    </Box>
  );
};
