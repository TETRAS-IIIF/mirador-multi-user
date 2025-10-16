import { memo } from "react";
import { Grid, TextField } from "@mui/material";
import { MMUToolTip } from "../../../components/elements/MMUTootlTip.tsx";

interface MetadataFieldProps {
  field: {
    term: string;
    label: string;
    definition: string;
    comment?: string;
    value?: string;
  };
  value: string;
  handleInputChange: (term: string, value: string) => void;
}

const MetadataField = memo(
  ({ field, value, handleInputChange }: MetadataFieldProps) => {
    return (
      <Grid size={12}>
        <Grid container alignItems="center" spacing={2}>
          <Grid size={11}>
            <TextField
              id={field.term}
              label={field.label}
              placeholder={field.definition}
              fullWidth
              variant="outlined"
              value={value}
              onChange={(e) => handleInputChange(field.term, e.target.value)}
              inputProps={{
                style: {
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
                maxLength: 255,
              }}/>
          </Grid>
          <Grid size={1}>
            {field.comment && (
              <MMUToolTip>
                <div>{field.comment}</div>
              </MMUToolTip>
            )}
          </Grid>
        </Grid>
      </Grid>
    );
  },
);

export default MetadataField;
