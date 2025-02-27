import { Layout } from "../components/layout";
import { LoginForm } from "../components/LoginForm";
import { Grid } from "@mui/material";
import { useTranslation } from "react-i18next";

export const Login = () => {
  const { t } = useTranslation();

  return (
    <Layout
      title={t("loginTitle")}
      rightButton={
        <Grid>
          {/*//TODO: This is commented for Houston first Implementation, this should be uncomented for allowing user to create account*/}

          {/*<NavLink to="/auth/signin">*/}
          {/*  <Typography variant="button">{t("register")}</Typography>*/}
          {/*</NavLink>*/}
        </Grid>
      }
    >
      <Grid item>
        <LoginForm />
      </Grid>
    </Layout>
  );
};
