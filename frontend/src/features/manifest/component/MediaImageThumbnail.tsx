import { Box, Grid } from "@mui/material";
import placeholder from "../../../assets/Placeholder.svg";

export function MediaImageThumbnail({ media }) {
  return (
    <Grid>
      {!media.thumbnailUrl && (
        <Box
          component="img"
          src={placeholder}
          loading="lazy"
          sx={{
            width: 50,
            height: 50,
            objectFit: "cover",
            "@media(min-resolution: 2dppx)": {
              width: 100,
              height: 100
            }
          }}
        />)
      }
      {media.thumbnailUrl && (
        <Box
          component="img"
          src={media.thumbnailUrl}
          loading="lazy"
          sx={{
            width: 50,
            height: 50,
            objectFit: "cover",
            "@media(min-resolution: 2dppx)": {
              width: 100,
              height: 100
            }
          }}
        />)
      }
    </Grid>
  );
}
