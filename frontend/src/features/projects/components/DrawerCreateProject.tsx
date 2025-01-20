import { AppBar, Button, Drawer, Grid, Paper, TextField, Toolbar, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreSharp';
import { ChangeEvent, FormEvent, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingButton } from '@mui/lab';

interface IDrawerCreateProjectProps {
  modalCreateProjectIsOpen: boolean;
  toggleModalProjectCreation: () => void;
  InitializeProject: (projectName: string) => void;
}

export const DrawerCreateProject = ({
                                      modalCreateProjectIsOpen,
                                      toggleModalProjectCreation,
                                      InitializeProject
                                    }: IDrawerCreateProjectProps) => {
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();

  const handleNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setProjectName(event.target.value);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await InitializeProject(projectName);
    } finally {
      setIsLoading(false);
      setProjectName('');
    }
  };

  const handleDrawerTransition = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <>
      <div>
        <Drawer anchor="bottom" open={modalCreateProjectIsOpen} onClose={toggleModalProjectCreation} ModalProps={{
          onAnimationEnd: handleDrawerTransition
        }}>
          <Paper
            sx={{
              left: '0',
              marginTop: 6,
              paddingBottom: 2,
              paddingLeft: { sm: 3, xs: 2 },
              paddingRight: { sm: 3, xs: 2 },
              paddingTop: 2,
              right: '0'
            }}
          >

            <AppBar position="absolute" color="primary" enableColorOnDark>
              <Toolbar variant="dense">
                <Button
                  color="inherit"
                  onClick={toggleModalProjectCreation}
                >
                  <ExpandMoreIcon />
                </Button>
                <Typography>{t('createProjectTitle')}</Typography>
              </Toolbar>
            </AppBar>
            <form onSubmit={handleSubmit}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item>
                  <label>{t('labelProjectTitle')}</label>
                </Grid>
                <Grid item sx={{ width: '70%' }}>
                  <TextField
                    inputRef={inputRef}
                    onChange={handleNameChange}
                    sx={{ width: '100%' }}
                    placeholder={t('placeholderProject')}
                    value={projectName}
                  />
                </Grid>
                <Grid item>
                  <LoadingButton
                    size="large"
                    variant="contained"
                    type="submit"
                    loading={isLoading}
                  >
                    {t('add')}
                  </LoadingButton>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Drawer>
      </div>
    </>
  );
};
