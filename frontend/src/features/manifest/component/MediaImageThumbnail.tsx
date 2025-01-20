import { Box, Grid, Typography } from "@mui/material";

export function MediaImageThumbnail({ media }) {

  const [isMediaValidURL, setIsMediaValidURL] = useState(false);
  return (
    <Grid>
      {!isMediaValidURL && (
        <Grid item>
          <Typography variant="subtitle1" color="red">
            {t("urlIsNotValid")}
          </Typography>
        </Grid>
      )
      }
      {media.thumbnailUrl && (
        <Box
          component="img"
          src={media.thumbnailUrl}
          loading="lazy"
          onError={() => setIsMediaValidURL(true)}
          onLoad={() => setIsMediaValidURL(false)}
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
