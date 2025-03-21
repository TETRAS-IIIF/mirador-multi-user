import { Grid, TextField } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useTranslation } from "react-i18next";
import { User } from "../../features/auth/types/types.ts";
import { Dayjs } from "dayjs";
import { ChangeEvent } from "react";

interface IMMUGeneralSettingsProps {
  handleChangeTitle: (e: ChangeEvent<HTMLInputElement>) => void;
  itemLabel: string;
  handleChangeDescription: (e: ChangeEvent<HTMLInputElement>) => void;
  description: string;
  handleChangeCreator: (e: ChangeEvent<HTMLInputElement>) => void;
  newItemMetadataCreator: string | null;
  user: User;
  setNewItemDate: (newDate: Dayjs | null) => void;
  thumbnailUrl: string | null | undefined;
  newItemDate: Dayjs | null;
  handleChangeThumbnailUrl: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const MMUGeneralSettings = ({
  handleChangeTitle,
  itemLabel,
  handleChangeDescription,
  description,
  handleChangeCreator,
  newItemMetadataCreator,
  user,
  setNewItemDate,
  thumbnailUrl,
  newItemDate,
  handleChangeThumbnailUrl,
}: IMMUGeneralSettingsProps) => {
  const { t } = useTranslation();

  function isValidUrl(string: string) {
    const pattern =
      /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
    return pattern.test(string);
  }

  return (
    <Grid
      container
      item
      sx={{
        overflowY: "auto",
        height: "100%",
      }}
    >
      <Grid
        item
        sx={{ minHeight: "50px", width: "100%", marginTop: "10px" }}
        container
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <TextField
          inputProps={{
            maxLength: 255,
          }}
          type="text"
          label={t("title")}
          onChange={handleChangeTitle}
          variant="outlined"
          defaultValue={itemLabel}
          fullWidth
        />
      </Grid>
      <Grid
        item
        sx={{ minHeight: "50px", width: "100%" }}
        container
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <TextField
          inputProps={{
            maxLength: 255,
          }}
          type="text"
          label={t("description")}
          onChange={handleChangeDescription}
          variant="outlined"
          defaultValue={description}
          multiline
          fullWidth
        />
      </Grid>
      <Grid
        item
        sx={{ minHeight: "50px", width: "100%" }}
        container
        justifyContent="flex-end"
        alignItems="center"
      >
        <TextField
          inputProps={{
            maxLength: 255,
          }}
          type="text"
          label={t("creator")}
          onChange={handleChangeCreator}
          variant="outlined"
          defaultValue={
            newItemMetadataCreator ? newItemMetadataCreator : user.name
          }
          multiline
          fullWidth
          disabled
        />
      </Grid>
      <Grid
        item
        sx={{ minHeight: "50px", width: "100%" }}
        container
        justifyContent="flex-start"
        alignItems="center"
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            disabled
            label={t("createdAt")}
            onChange={(newValue) => setNewItemDate(newValue)}
            value={newItemDate}
          />
        </LocalizationProvider>
      </Grid>
      <Grid
        item
        sx={{ minHeight: "50px", width: "100%" }}
        container
        justifyContent="flex-end"
        alignItems="center"
      >
        <TextField
          type="text"
          label={t("thumbnailUrl")}
          inputProps={{
            maxLength: 255,
          }}
          onChange={handleChangeThumbnailUrl}
          variant="outlined"
          defaultValue={
            thumbnailUrl && isValidUrl(thumbnailUrl) ? thumbnailUrl : undefined
          }
          multiline
          fullWidth
        />
      </Grid>
    </Grid>
  );
};
