import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import { FieldForm } from "../../../components/elements/FieldForm";
import { Box, Typography } from "@mui/material";
import { MMUToolTip } from "../../../components/elements/MMUTootlTip";
import { ChangeEvent, useState } from "react";

export const ManifestCreationFormThumbnail =
  ({
     manifestThumbnail,
     setManifestThumbnail,
     t
   }) => {
    const [isManifestThumbnailBadURL, setIsManifestThumbnailBadURL] = useState(false);

    const handleManifestThumbnailChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setManifestThumbnail(e.target.value);
    };

    return (
      <Grid item container>
        <Paper elevation={3} style={{ padding: "20px", width: "100%" }}>
          <Grid item container spacing={4} alignItems="center">
            <Grid item xs={8}>
              <FieldForm
                name="manifest-thumbnail"
                placeholder={t("Manifest thumbnail URL")}
                label="Manifest Thumbnail"
                value={manifestThumbnail}
                onChange={handleManifestThumbnailChange}
              />
            </Grid>
            <Grid item>
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
                      height: 100
                    }
                  }}
                />
              )}
            </Grid>
            <Grid item>
              <MMUToolTip>
                <div>
                  Media shouldn't weigh more than 1MB.
                  <br />
                  If the URL comes from your media library, we took care of this for you.
                </div>
              </MMUToolTip>
            </Grid>
            {isManifestThumbnailBadURL && (
              <Grid item>
                <Typography variant="subtitle1" color="red">
                  URL is not valid
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>
    );
  };
