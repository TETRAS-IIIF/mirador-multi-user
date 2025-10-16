import { Checkbox, FormControlLabel, Grid, Link } from '@mui/material';
import { Layout } from './layout.tsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useValidTerms } from '../api/validTerms.ts';
import { LoadingButton } from '@mui/lab';

export const ValidateTerms = () => {
  const [checked, setChecked] = useState(false);
  const { t } = useTranslation();

  const { mutateAsync: acceptTerms, isPending } = useValidTerms();

  const handleValidate = async () => {
    if (!checked) {
      toast.error(t('mustAcceptTerms'));
      return;
    }
    try {
      await acceptTerms();
      toast.success(t('termsValidated'));
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error(t('termsValidationFailed'));
    }
  };
  return (
    <Layout title={t('validate-terms-title')}>
      <Grid
        container
        direction="column"
        justifyContent="center"
        alignItems="center"
        spacing={3}>
        <Grid>
          <FormControlLabel
            required
            control={
              <Checkbox
                checked={checked}
                onChange={() => setChecked((prev) => !prev)}/>
            }
            label={
              <>
                {t('accept_terms')}{' '}
                <Link component={RouterLink} to="/terms" target="_blank">
                  {t('terms')}
                </Link>
              </>
            }/>
        </Grid>
        <Grid>
          <LoadingButton
            variant="contained"
            color="primary"
            onClick={handleValidate}
            disabled={!checked}
            loading={isPending}>
            {t('validateTerms')}
          </LoadingButton>
        </Grid>
      </Grid>
    </Layout>
  );
};
