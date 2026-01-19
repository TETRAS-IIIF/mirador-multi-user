import { Button, Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import FormField from "components/elements/FormField.tsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginFormData, LoginSchema } from "../types/types.ts";
import { useLogin } from "../../../utils/auth.tsx";
import { LoginCredentialsDTO } from "../api/login.ts";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const LoginForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutateAsync: loginUser } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    mode: "onSubmit",
  });

  const onSubmit = async (data: LoginCredentialsDTO) => {
    try {
      await loginUser(data, { onSuccess: () => navigate("/app/my-projects") });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ width: "100%" }}>
      <Grid container direction="column" spacing={{ xs: 2, sm: 2.5 }} sx={{ width: "100%" }}>
        <Grid size={12}>
          <FormField
            type="email"
            placeholder={t("mail")}
            name="mail"
            required
            register={register}
            error={errors.mail}
            fullWidth
          />
        </Grid>

        <Grid  size={12}>
          <FormField
            type="password"
            placeholder={t("password")}
            name="password"
            required
            register={register}
            error={errors.password}
            fullWidth
          />
        </Grid>

        <Grid size={12}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="button"
              variant="text"
              onClick={() => (window.location.href = "/forgot-password")}
              sx={{ px: 0, minWidth: 0, textTransform: "none" }}
            >
              {t("forgot-password")}
            </Button>
          </Box>
        </Grid>

        <Grid size={12}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            sx={{ py: 1.25, borderRadius: 2 }}
          >
            {t("submit")}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
