import { Layout } from "../components/layout";
import { LoginForm } from "../components/LoginForm";
import { Grid, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const Login = () => {
  const { t } = useTranslation();

  return (
    <Layout
      title={t("loginTitle")}
      rightButton={
        <Grid>
          <NavLink to="/auth/signin">
            <Typography variant="button">{t("register")}</Typography>
          </NavLink>
        </Grid>
      }
    >
      <LoginForm />
    </Layout>
  );
};
