import React from 'react';
import { FieldError, UseFormRegister } from 'react-hook-form';
import { FormLabel, Grid, TextField } from '@mui/material';

interface FormFieldProps {
  type: string;
  placeholder: string;
  name: string;
  register: UseFormRegister<any>;
  required: boolean;
  error?: FieldError;
  valueAsNumber?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  type,
  placeholder,
  name,
  register,
  error,
  valueAsNumber,
}) => {
  return (
    <Grid
      container
      alignItems="center"
      spacing={2}
      justifyContent="space-between"
    >
      <Grid>
        <TextField
          type={type}
          inputProps={{
            maxLength: 255,
          }}
          label={placeholder}
          variant="outlined"
          {...register(name, { valueAsNumber })}
          error={!!error}
        />
      </Grid>
      {error && (
        <Grid width={200}>
          <FormLabel error={true}>{error.message}</FormLabel>
        </Grid>
      )}
    </Grid>
  );
};
export default FormField;
