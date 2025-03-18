import { useNavigate } from "react-router-dom";
import { Button, Grid, Typography } from "@mui/material";
import { theme } from "../../assets/theme/mainTheme.ts";
import { useTranslation } from "react-i18next";

export const Disconnect = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Grid
      container
      direction="column"
      justifyContent="center"
      alignItems="center"
      spacing={1}
      minHeight={"100vh"}
      sx={{
        backgroundImage: theme.palette.backgroundImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        marginTop: 0,
      }}
    >
      <Grid
        item
        container
        sx={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
        spacing={1}
      >
        <Grid item>
          <Typography variant="h5" component="div">
            {t("disconnect_error")}
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/auth/login")}
          >
            {t("login")}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};
