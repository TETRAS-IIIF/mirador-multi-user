import React from "react";
import { FieldError, UseFormRegister } from "react-hook-form";
import { Box, FormLabel, Stack, TextField } from "@mui/material";

interface FormFieldProps {
  error?: FieldError;
  fullWidth?: boolean;
  name: string;
  placeholder: string;
  register: UseFormRegister<any>;
  required: boolean;
  type: string;
  valueAsNumber?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
                                               error,
                                               fullWidth = true,
                                               name,
                                               placeholder,
                                               register,
                                               required,
                                               type,
                                               valueAsNumber,
                                             }) => {
  return (
    <Stack
      spacing={1}
      sx={{
        width: "100%",
      }}
    >
      <TextField
        type={type}
        label={placeholder}
        variant="outlined"
        required={required}
        fullWidth={fullWidth}
        inputProps={{ maxLength: 255 }}
        {...register(name, { valueAsNumber })}
        error={!!error}
      />

      {error ? (
        <Box sx={{ minWidth: 0 }}>
          <FormLabel error sx={{ display: "block" }}>
            {error.message}
          </FormLabel>
        </Box>
      ) : null}
    </Stack>
  );
};

export default FormField;
