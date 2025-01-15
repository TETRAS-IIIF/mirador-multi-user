import { AppBar, Button, Drawer, Grid, Paper, TextField, Toolbar, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMoreSharp";
import { ChangeEvent, FormEvent, useCallback, useRef, useState } from "react";
import { LoadingButton } from '@mui/lab';


interface IDrawerCreateManifestProps{
  modalCreateManifestIsOpen: boolean
  toggleModalManifestCreation:()=>void
  linkingManifest:(link:string)=>Promise<string>
}

export const DrawerLinkManifest = ({toggleModalManifestCreation,modalCreateManifestIsOpen,linkingManifest}:IDrawerCreateManifestProps) =>{
  const [isLoading, setIsLoading] = useState(false);
  const [manifestLink, setManifestLink] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNameChange  = useCallback((event:ChangeEvent<HTMLInputElement>)=>{
    setManifestLink(event.target.value);
  },[])

  const handleLinkingManifest = useCallback((event?:FormEvent)=>{
    if (event) event.preventDefault();
    toggleModalManifestCreation();
    setIsLoading(true);
    try{
      linkingManifest(manifestLink);
    }finally {
      setIsLoading(false);
      setManifestLink('');
    }
  },[linkingManifest, manifestLink, toggleModalManifestCreation])

  const handleToggleModalGroupCreation= useCallback(()=>{
    toggleModalManifestCreation();
    setManifestLink('');
  },[toggleModalManifestCreation])

  const handleDrawerTransition = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <>
      <div>
        <Drawer anchor="bottom" open={modalCreateManifestIsOpen} onClose={handleToggleModalGroupCreation} ModalProps={{
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
            }}
          >

            <AppBar position="absolute" color="primary" enableColorOnDark >
              <Toolbar variant="dense">
                <Button
                  color="inherit"
                  onClick={toggleModalManifestCreation}
                >
                  <ExpandMoreIcon />
                </Button>
                <Typography>LINK MANIFEST</Typography>
              </Toolbar>
            </AppBar>
            <form onSubmit={handleLinkingManifest}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item>
                  <label>Manifest's link :</label>
                </Grid>
                <Grid item sx={{ width:'70%'}}>
                  <TextField inputRef={inputRef} onChange={handleNameChange} sx={{ width:'100%'}} ></TextField>
                </Grid>
                <Grid item>
                  <LoadingButton
                    size="large"
                    variant="contained"
                    onClick={handleLinkingManifest}
                    loading={isLoading}
                  >
                    ADD
                  </LoadingButton>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Drawer>
      </div>
    </>
  )
}