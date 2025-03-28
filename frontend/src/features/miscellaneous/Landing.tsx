import { useNavigate } from "react-router-dom";
import { Button, Grid, Typography } from "@mui/material";
import { theme } from "../../assets/theme/mainTheme.ts";
import { useTranslation } from "react-i18next";
import { LandingFooter } from "../../../customAssets/landing-footer.tsx";

export const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  /* const HandleSignIn = () => {
     navigate("/auth/signin");
   };*/
  const HandleLogin = () => {
    navigate("/auth/login");
  };
  return (
    <Grid
      container
      direction="column"
      justifyContent="center"
      alignItems="center"
      spacing={10}
      minHeight={"100vh"}
      sx={{
        backgroundImage: theme.palette.backgroundImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        marginTop: 0,
      }}
    >
      <Grid item>
        <Typography variant="h2" component="h1">
          {t("welcome", { instanceName: import.meta.env.VITE_INSTANCE_NAME })}
        </Typography>
      </Grid>
      <Grid
        item
        container
        justifyContent="center"
        spacing={5}
        alignItems="center"
      >
        {/* <Grid item>
          <Button variant="contained" onClick={HandleSignIn}>
            {t("create-account")}
          </Button>
        </Grid>*/}
        <Grid item>
          <Button variant="contained" onClick={HandleLogin}>
            {t("login")}
          </Button>
        </Grid>
      </Grid>
      <Grid item width={"100%"}>
        <LandingFooter></LandingFooter>
      </Grid>
    </Grid>
  );
};
