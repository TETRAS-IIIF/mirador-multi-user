import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { Layout } from "./layout.tsx";
import { forgotPassword } from "../api/forgotPassword.ts";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { t } = useTranslation();

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");

    if (!email) {
      setError(t("errorMail"));
      return;
    }
    const response = await forgotPassword(email);
    if (response) {
      setSuccess(t("successResetPassword"));
    } else {
      setError(t("errorResetPassword"));
    }
  };

  return (
    <Layout
      title={t("titleForgotPassword")}
      rightButton={
        <Grid>
          <NavLink to="/auth/login">
            <Typography variant="button">{t("login")}</Typography>
          </NavLink>
        </Grid>
      }
    >
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center">
          <Box sx={{ p: 4, borderRadius: 2, boxShadow: 3, width: "100%" }}>
            <Typography variant="h5" align="center" gutterBottom>
              {t("forgot-password")}
            </Typography>
            <Typography variant="body2" align="center" sx={{ mb: 2 }}>
              {t("explanationPasswordReset")}
            </Typography>
            <TextField
              inputProps={{
                maxLength: 255,
              }}
              label={t("mail")}
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
              onClick={handleForgotPassword}
            >
              {t("submit")}
            </Button>
          </Box>
        </Box>
      </Container>
    </Layout>
  );
};

export default ForgotPassword;
