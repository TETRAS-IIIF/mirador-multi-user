import { FieldForm } from "../../../components/elements/FieldForm";
import { Box, Button, Grid, Paper } from "@mui/material";
import { useState } from "react";
import { BigSpinner } from "../../../components/elements/spinner";
import placeholder from "../../../assets/Placeholder.svg";

export const ManifestCreationFormCanvas = ({
                                             canvas,
                                             canvasIndex,
                                             t,
                                             handleMediaChange,
                                             handleRemoveCanvas
                                           }) => {

    const [isMediaLoading, setIsMediaLoading] = useState(false);

    const onMediaChange = async (e) => {
      const mediaURL = e.target.value;
      setIsMediaLoading(true);
      try {
        await handleMediaChange(canvasIndex, mediaURL);
      } finally {
        setIsMediaLoading(false);
      }
    };

    console.log(canvas.media[0]);

    return (
      <Grid item key={canvasIndex}>
        <Paper elevation={3} sx={{ padding: 2, width: "100%" }}>
          <Grid container direction="column" spacing={2}>
            <Grid item container spacing={2} alignItems="center">
              <Grid item xs>
                <FieldForm
                  name={canvas.media[0].title}
                  placeholder={t("mediaLink")}
                  label={t("mediaLink")}
                  value={canvas.media[0].value}
                  onChange={onMediaChange}
                />
              </Grid>
              {canvas.media[0].value && (
                <Grid item>
                  {!canvas.media[0].thumbnailUrl && (
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
                  <Box
                    component="img"
                    src={canvas.media[0].thumbnailUrl}
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
                  />
                </Grid>
              )}
              <Grid item>
                {isMediaLoading && <BigSpinner />}
              </Grid>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleRemoveCanvas(canvasIndex)}
              >
                {t("canvasRemoving", { index: canvasIndex + 1 })}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    );
  }
;
