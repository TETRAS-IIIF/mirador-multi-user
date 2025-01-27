import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { updateUser } from "../auth/api/updateUser.tsx";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface UserProfile {
  name: string;
  mail: string;
}

interface ProfileUpdateFormProps {
  user: UserProfile;
}

export const ProfileUpdateForm: React.FC<ProfileUpdateFormProps> = ({
  user,
}) => {
  const { t } = useTranslation();
  const [formValues, setFormValues] = useState({
    name: "",
    mail: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [errors, setErrors] = useState({
    name: "",
    mail: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setFormValues({ ...formValues, name: user.name, mail: user.mail });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      name: "",
      mail: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    if (
      formValues.mail.trim() &&
      !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formValues.mail)
    ) {
      newErrors.mail = t("mailIsNotValid");
      valid = false;
    }

    if (formValues.newPassword && formValues.newPassword.length < 6) {
      newErrors.newPassword = t("characterLimitForPassword");
      valid = false;
    }

    if (formValues.newPassword !== formValues.confirmPassword) {
      newErrors.confirmPassword = t("passwordMismatch");
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      const updatedUser = await updateUser({
        ...formValues,
      });
      if (updatedUser) {
        toast.success(t("userSuccessfullyUpdated"));
      } else {
        toast.error(t("toastErrorUpdateUser"));
      }
    }
  };

  const togglePasswordVisibility = (field: string) => {
    // @ts-ignore
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "40%",
        maxWidth: "400px",
      }}
    >
      <Typography variant="h5" sx={{ mb: 3 }}>
        {t("UpdateProfile")}
      </Typography>

      <TextField
        label={t("name")}
        name="name"
        value={formValues.name}
        onChange={handleChange}
        error={!!errors.name}
        helperText={errors.name}
        fullWidth
        sx={{ mb: 2 }}
      />

      <TextField
        label={t("mail")}
        name="mail"
        type="mail"
        value={formValues.mail}
        onChange={handleChange}
        error={!!errors.mail}
        helperText={errors.mail}
        fullWidth
        sx={{ mb: 2 }}
      />

      <TextField
        label={t("oldPassword")}
        name="oldPassword"
        type={showPassword.oldPassword ? "text" : "password"}
        value={formValues.oldPassword}
        onChange={handleChange}
        error={!!errors.oldPassword}
        helperText={errors.oldPassword}
        fullWidth
        sx={{ mb: 2 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => togglePasswordVisibility("oldPassword")}
                edge="end"
              >
                {showPassword.oldPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        label={t("newPassword")}
        name="newPassword"
        type={showPassword.newPassword ? "text" : "password"}
        value={formValues.newPassword}
        onChange={handleChange}
        error={!!errors.newPassword}
        helperText={errors.newPassword}
        fullWidth
        sx={{ mb: 2 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => togglePasswordVisibility("newPassword")}
                edge="end"
              >
                {showPassword.newPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        label={t("confirmPassword")}
        name="confirmPassword"
        type={showPassword.confirmPassword ? "text" : "password"}
        value={formValues.confirmPassword}
        onChange={handleChange}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword}
        fullWidth
        sx={{ mb: 2 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => togglePasswordVisibility("confirmPassword")}
                edge="end"
              >
                {showPassword.confirmPassword ? (
                  <VisibilityOff />
                ) : (
                  <Visibility />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
      >
        {t("saveChanges")}
      </Button>
    </Box>
  );
};
