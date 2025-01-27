import {
  Button,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { ResendConfirmationMail } from "../api/resendConfirmationMail.ts";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Layout } from "./layout.tsx";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export const NotConfirmedAccount = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); // Prepopulate if email is available
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { t } = useTranslation();

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const handleResendConfirmation = async () => {
    if (!isValidEmail(email)) {
      toast.error(t("invalidEmail"));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await ResendConfirmationMail(email, navigator.language.split("-")[0]);
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      toast.error(t("resendError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title={t("notConfirmedAccountTitle")}>
      <Grid
        container
        direction="column"
        justifyContent="center"
        alignItems="center"
        spacing={2}
      >
        <Grid item>
          <TextField
            label={t("emailAddress")}
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            onClick={handleResendConfirmation}
            disabled={isLoading || success || !email}
          >
            {isLoading ? (
              <CircularProgress size={24} />
            ) : (
              t("resendConfirmationLink")
            )}
          </Button>
        </Grid>
        {error && (
          <Grid item>
            <Typography color="error">{error}</Typography>
          </Grid>
        )}
        {success && (
          <Grid item>
            <Typography color="primary">
              {t("messageConfirmationLink")}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Layout>
  );
};
