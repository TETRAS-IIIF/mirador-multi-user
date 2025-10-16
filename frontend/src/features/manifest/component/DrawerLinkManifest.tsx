import {
  AppBar,
  Button,
  Drawer,
  Grid,
  Paper,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreSharp';
import { ChangeEvent, FormEvent, useCallback, useRef, useState } from 'react';
import { LoadingButton } from '@mui/lab';
import { useTranslation } from 'react-i18next';

interface IDrawerCreateManifestProps {
  modalCreateManifestIsOpen: boolean;
  toggleModalManifestCreation: () => void;
  linkingManifest: (link: string) => Promise<void>;
  isPending: boolean;
}

export const DrawerLinkManifest = ({
  toggleModalManifestCreation,
  modalCreateManifestIsOpen,
  linkingManifest,
  isPending,
}: IDrawerCreateManifestProps) => {
  const [manifestLink, setManifestLink] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setManifestLink(event.target.value);
    },
    [],
  );

  const handleLinkingManifest = useCallback(
    (event?: FormEvent) => {
      if (event) event.preventDefault();
      toggleModalManifestCreation();
      try {
        linkingManifest(manifestLink);
      } finally {
        setManifestLink('');
      }
    },
    [linkingManifest, manifestLink, toggleModalManifestCreation],
  );

  const handleToggleModalGroupCreation = useCallback(() => {
    toggleModalManifestCreation();
    setManifestLink('');
  }, [toggleModalManifestCreation]);

  const handleDrawerTransition = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const { t } = useTranslation();

  return (
    <Drawer
      anchor="bottom"
      open={modalCreateManifestIsOpen}
      onClose={handleToggleModalGroupCreation}
      ModalProps={{
        onAnimationEnd: handleDrawerTransition,
      }}>
      <Paper
        sx={{
          left: '0',
          marginTop: 6,
          paddingBottom: 2,
          paddingLeft: { sm: 3, xs: 2 },
          paddingRight: { sm: 3, xs: 2 },
          paddingTop: 2,
          right: '0',
        }}>
        <AppBar position="absolute" color="primary" enableColorOnDark>
          <Toolbar variant="dense">
            <Button color="inherit" onClick={toggleModalManifestCreation}>
              <ExpandMoreIcon/>
            </Button>
            <Typography>{t('linkManifest')}</Typography>
          </Toolbar>
        </AppBar>
        <form onSubmit={handleLinkingManifest}>
          <Grid container alignItems="center" spacing={2}>
            <Grid>
              <label>{t('manifestLink')} :</label>
            </Grid>
            <Grid sx={{ width: '70%' }}>
              <TextField
                inputProps={{
                  maxLength: 255,
                }}
                inputRef={inputRef}
                onChange={handleNameChange}
                sx={{ width: '100%' }}
                placeholder={t('validURLToManifest')}></TextField>
            </Grid>
            <Grid>
              <LoadingButton
                size="large"
                variant="contained"
                onClick={handleLinkingManifest}
                loading={isPending}
                disabled={!manifestLink}>
                {t('linkManifest')}
              </LoadingButton>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Drawer>
  );
};
