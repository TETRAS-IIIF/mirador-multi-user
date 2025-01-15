import { AppBar, Button, Drawer, Grid, Paper, TextField, Toolbar, Typography } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreSharp';
import { ChangeEvent, useCallback, useState, KeyboardEvent, useRef } from "react";
import { useTranslation } from "react-i18next";

interface IDrawerCreateGroupProps{
  modalCreateGroup: boolean
  toggleModalGroupCreation:()=>void
  handleCreatGroup:(title:string) => void
}

export const DrawerCreateGroup = ({modalCreateGroup, toggleModalGroupCreation, handleCreatGroup}: IDrawerCreateGroupProps) => {
  const [userGroupName, setUserGroupName] = useState<string>('');
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);


  const handleNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setUserGroupName(event.target.value);
  }, []);

  const handleUserCreation = useCallback(() => {
    if (userGroupName.trim()) {
      toggleModalGroupCreation();
      handleCreatGroup(userGroupName);
      setUserGroupName('');
    }
  }, [handleCreatGroup, userGroupName, toggleModalGroupCreation]);

  const handleToggleModalGroupCreation = useCallback(() => {
    toggleModalGroupCreation();
    setUserGroupName('');
  }, [toggleModalGroupCreation]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && userGroupName.trim()) {
      event.preventDefault();
      handleUserCreation();
    }
  };

  const handleDrawerTransition = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div>
      <Drawer anchor="bottom" open={modalCreateGroup} onClose={handleToggleModalGroupCreation} ModalProps={{
        onAnimationEnd: handleDrawerTransition,
      }}>
        <Paper
          sx={{
            left: '0',
            marginTop: 6,
            paddingBottom: 2,
            paddingLeft: { sm: 3, xs: 2 },
            paddingTop: 2,
            right: '0',
          }}
        >
          <AppBar position="absolute" color="primary" enableColorOnDark >
            <Toolbar variant="dense">
              <Button color="inherit" onClick={toggleModalGroupCreation}>
                <ExpandMoreIcon />
              </Button>
              <Typography>{t('createGroup')}</Typography>
            </Toolbar>
          </AppBar>
          <Grid>
            <Grid item container alignItems="center" spacing={2}>
              <Grid item>
                <Typography>{t('groupTitleLabel')}</Typography>
              </Grid>
              <Grid item sx={{ width: '70%' }}>
                <TextField
                  inputRef={inputRef}
                  onChange={handleNameChange}
                  onKeyDown={handleKeyDown}
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid item>
                <Button
                  size="large"
                  variant="contained"
                  onClick={handleUserCreation}
                  disabled={userGroupName.length < 1}
                >
                  {t('createGroupMAJ')}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Drawer>
    </div>
  );
};
