import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import { FieldForm } from "../../../components/elements/FieldForm";
import { Box, Typography } from "@mui/material";
import { MMUToolTip } from "../../../components/elements/MMUTootlTip";
import { ChangeEvent, useState } from "react";

interface ManifestCreationFormThumbnailProps {
  manifestThumbnail: string;
  setManifestThumbnail: (manifestThumbnail: string) => void;
  t: {
    (key: string): string;
    (key: string, options?: Record<string, number>): string;
  };
}

export const ManifestCreationFormThumbnail = ({
  manifestThumbnail,
  setManifestThumbnail,
  t,
}: ManifestCreationFormThumbnailProps) => {
  const [isManifestThumbnailBadURL, setIsManifestThumbnailBadURL] =
    useState(false);

  const handleManifestThumbnailChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setManifestThumbnail(e.target.value);
  };

  return (
    <Grid container>
      <Paper elevation={3} style={{ padding: "20px", width: "100%" }}>
        <Grid container spacing={4} alignItems="center">
          <Grid xs={8}>
            <FieldForm
              name="manifest-thumbnail"
              placeholder={t("manifestThumbnailUrl")}
              label={t("manifestThumbnail")}
              value={manifestThumbnail}
              onChange={handleManifestThumbnailChange}/>
          </Grid>
          <Grid>
            {manifestThumbnail && (
              <Box
                component="img"
                src={manifestThumbnail}
                loading="lazy"
                onError={() => setIsManifestThumbnailBadURL(true)}
                onLoad={() => setIsManifestThumbnailBadURL(false)}
                sx={{
                  width: 50,
                  height: 50,
                  objectFit: "cover",
                  "@media(min-resolution: 2dppx)": {
                    width: 100,
                    height: 100,
                  },
                }}/>
            )}
          </Grid>
          <Grid>
            <MMUToolTip>
              <div>
                {t("mediaShouldBeNoMoreThan", { size: 1 })}
                <br/>
                {t("mediaOriginInfo")}
              </div>
            </MMUToolTip>
          </Grid>
          {isManifestThumbnailBadURL && (
            <Grid>
              <Typography variant="subtitle1" color="red">
                {t("urlIsNotValid")}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Grid>
  );
};
