import { useForm } from "react-hook-form";
import { Button, Grid, Snackbar } from "@mui/material";
import FormField from "components/elements/FormField.tsx";
import { RegisterFormData, UserSchema } from "../types/types.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "../../../utils/auth.tsx";
import { RegisterCredentialsDTO } from "../api/register.ts";
import { useNavigate } from "react-router-dom";
import React from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export const RegisterForm = () => {
  const navigate = useNavigate(); // Use hooks at the top level
  const { t } = useTranslation();

  //this is a hook from React-Query that allow us to use createUser(data) bellow
  const { mutateAsync: createUser } = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(UserSchema),
  });

  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const onSubmit = async (data: RegisterCredentialsDTO) => {
    try {
      await createUser(data, {
        onSuccess: () => {
          toast.success(t("accountCreated"));
          navigate("/");
        },
      });
    } catch (error: any) {
      console.error("error", error);
      setOpen(true);
      setMessage(error.toString());
    }
  };

  return (
    <form>
      <Snackbar open={open} message={message} autoHideDuration={10} />
      <Grid
        container
        direction="column"
        justifyContent="center"
        spacing={2}
        maxWidth={"1000px"}
      >
        <Grid item>
          <FormField
            type="mail"
            placeholder={t("mail")}
            name="mail"
            required={true}
            register={register}
            error={errors.mail}
          />
        </Grid>
        <Grid item>
          <FormField
            type="text"
            placeholder={t("name")}
            name="name"
            required={true}
            register={register}
            error={errors.name}
          />
        </Grid>
        <Grid item>
          <FormField
            type="password"
            placeholder={t("password")}
            name="password"
            register={register}
            required={true}
            error={errors.password}
          />
        </Grid>
        <Grid item>
          <FormField
            type="password"
            placeholder={t("confirm-password")}
            name="confirmPassword"
            register={register}
            required={true}
            error={errors.confirmPassword}
          />
        </Grid>
        <Grid item container>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            onClick={handleSubmit(onSubmit)}
          >
            {t("submit")}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};
