import { Grid, TextField } from "@mui/material";
import { ChangeEventHandler } from "react";

interface IFieldFormProps {
  label: string;
  value: string;
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  type?: string;
  placeholder: string;
  name: string;
}

export const FieldForm = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  name,
}: IFieldFormProps) => {
  return (
    <Grid item>
      <TextField
        label={label}
        variant="outlined"
        fullWidth
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
      />
    </Grid>
  );
};
