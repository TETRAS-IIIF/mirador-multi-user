import {
  AppBar,
  Button,
  Drawer,
  Grid,
  Paper,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMoreSharp";
import { ChangeEvent, FormEvent, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoadingButton } from "@mui/lab";

interface IDrawerCreateMediaProps {
  modalCreateMediaIsOpen: boolean;
  toggleModalMediaCreation: () => void;
  CreateMediaWithLink: (link: string) => void;
}

export const DrawerLinkMedia = ({
  modalCreateMediaIsOpen,
  toggleModalMediaCreation,
  CreateMediaWithLink,
}: IDrawerCreateMediaProps) => {
  const [mediaLink, setMediaLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();

  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMediaLink(event.target.value);
    },
    [],
  );

  const handleLinkingMedia = useCallback(
    (event?: FormEvent) => {
      if (event) event.preventDefault();
      toggleModalMediaCreation();
      setIsLoading(true);
      try {
        CreateMediaWithLink(mediaLink);
      } finally {
        setIsLoading(false);
        setMediaLink("");
      }
    },
    [CreateMediaWithLink, mediaLink, toggleModalMediaCreation],
  );

  const handleToggleModalGroupCreation = useCallback(() => {
    toggleModalMediaCreation();
    setMediaLink("");
  }, [CreateMediaWithLink]);

  const handleDrawerTransition = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  return (
    <>
      <div>
        <Drawer
          sx={{ zIndex: 9999 }}
          anchor="bottom"
          open={modalCreateMediaIsOpen}
          onClose={handleToggleModalGroupCreation}
          ModalProps={{
            onAnimationEnd: handleDrawerTransition,
          }}
        >
          <Paper
            sx={{
              left: "0",
              marginTop: 6,
              paddingBottom: 2,
              paddingLeft: { sm: 3, xs: 2 },
              paddingRight: { sm: 3, xs: 2 },
              paddingTop: 2,
              right: "0",
              zIndex: 9999,
            }}
          >
            <AppBar position="absolute" color="primary" enableColorOnDark>
              <Toolbar variant="dense">
                <Button color="inherit" onClick={toggleModalMediaCreation}>
                  <ExpandMoreIcon />
                </Button>
                <Typography>{t("linkMedia")}</Typography>
              </Toolbar>
            </AppBar>
            <form onSubmit={handleLinkingMedia}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item>
                  <label>{t("mediaLink")}:</label>
                </Grid>
                <Grid item sx={{ width: "70%" }}>
                  <TextField
                    inputProps={{
                      maxLength: 255,
                    }}
                    inputRef={inputRef}
                    onChange={handleNameChange}
                    sx={{ width: "100%" }}
                  ></TextField>
                </Grid>
                <Grid item>
                  <LoadingButton
                    size="large"
                    variant="contained"
                    onClick={handleLinkingMedia}
                    loading={isLoading}
                  >
                    {t("add")}
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
