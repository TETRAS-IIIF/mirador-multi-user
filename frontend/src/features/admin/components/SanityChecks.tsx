import { useEffect, useState } from 'react';
import { Grid, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useTranslation } from 'react-i18next';
import {
  getSanityChecks,
  SanityCheckResult,
} from '../api/getSanityChecks.ts';

const CHECK_TITLE_KEYS: Record<string, string> = {
  USER_PERSONAL_GROUP: 'sanity_check_user_personal_group',
};

export const SanityChecks = () => {
  const [checks, setChecks] = useState<SanityCheckResult[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    getSanityChecks().then((results) => {
      if (results) {
        setChecks(results);
      }
    });
  }, []);

  return (
    <Grid sx={{ margin: 1 }}>
      <Typography variant="h6" gutterBottom>
        {t('sanity_check_title')}
      </Typography>
      <Stack spacing={1}>
        {checks.map((check) => (
          <Stack key={check.key} direction="row" spacing={1} alignItems="center">
            {check.passed ? (
              <CheckCircleIcon color="success" fontSize="small" />
            ) : (
              <CancelIcon color="error" fontSize="small" />
            )}
            <Typography
              sx={{ color: check.passed ? 'success.main' : 'error.main' }}
            >
              {t(CHECK_TITLE_KEYS[check.key] ?? check.key)}
            </Typography>
            {!check.passed && check.details && (
              <Typography variant="body2" color="text.secondary">
                {check.details}
              </Typography>
            )}
          </Stack>
        ))}
      </Stack>
    </Grid>
  );
};
