import { Box, Grid, Typography } from "@mui/material";
import { useState } from "react";
import { MediaField } from "./ManifestCreationForm";

interface MediaImageThumbnailProps {
  media: MediaField;
  t: {
    (key: string): string;
    (key: string, options?: Record<string, number>): string;
  };
}

export function MediaImageThumbnail({ media, t }: MediaImageThumbnailProps) {
  const [isMediaValidURL, setIsMediaValidURL] = useState(false);
  return (
    <Grid>
      {!isMediaValidURL && (
        <Grid>
          <Typography variant="subtitle1" color="red">
            {t("urlIsNotValid")}
          </Typography>
        </Grid>
      )}
      {media.thumbnailUrl && (
        <Box
          component="img"
          src={media.thumbnailUrl}
          loading="lazy"
          onLoad={() => setIsMediaValidURL(true)}
          onError={() => setIsMediaValidURL(false)}
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
  );
}
