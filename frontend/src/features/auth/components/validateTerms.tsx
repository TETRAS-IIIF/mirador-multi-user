import { Button, Checkbox, FormControlLabel, Grid, Link } from '@mui/material';
import { Layout } from './layout.tsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { validTerms } from '../api/validTerms.ts';

export const ValidateTerms = () => {
  const [checked, setChecked] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleValidate = async () => {
    if (checked) {
      toast.success(t('termsValidated'));
      const validateTermsForUser = await validTerms();
      if (validateTermsForUser === 200) {
        navigate('/app/my-projects');
      }
    } else {
      toast.error(t('mustAcceptTerms'));
    }
  };

  return (
    <Layout title={t('validate-terms-title')}>
      <Grid
        container
        direction="column"
        justifyContent="center"
        alignItems="center"
        spacing={3}
      >
        <Grid item>
          <FormControlLabel
            required
            control={
              <Checkbox
                checked={checked}
                onChange={() => setChecked((prev) => !prev)}
              />
            }
            label={
              <>
                {t('accept_terms')}{' '}
                <Link component={RouterLink} to="/terms" target="_blank">
                  {t('terms')}
                </Link>
              </>
            }
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            onClick={handleValidate}
            disabled={!checked}
          >
            {t('validateTerms')}
          </Button>
        </Grid>
      </Grid>
    </Layout>
  );
};
