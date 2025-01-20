import { FieldForm } from "../../../components/elements/FieldForm";
import { Button, Grid, Paper } from "@mui/material";
import { useState } from "react";
import { MediaTypes } from "../../media/types/types";
import { MediaImageThumbnail } from "./MediaImageThumbnail";
import { MediaVideoThumbnail } from "./MediaVideoThumbnail";

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
    const media = canvas.media[0];

    return (
      <Grid item key={canvasIndex}>
        <Paper elevation={3} sx={{ padding: 2, width: "100%" }}>
          <Grid container direction="column" spacing={2}>
            <Grid item container spacing={2} alignItems="center">
              <Grid item xs>
                <FieldForm
                  name={media.title}
                  placeholder={t("mediaLink")}
                  label={t("mediaLink")}
                  value={media.value}
                  onChange={onMediaChange}
                />
              </Grid>
              {isMediaLoading && <h2>Loading ...</h2>}
              {(media.value && !isMediaLoading) && (
                <Grid item>
                  {media.type === MediaTypes.VIDEO && (
                    <MediaVideoThumbnail media={media} t={t} />
                  )
                  }
                  {media.type === MediaTypes.IMAGE && (
                    <MediaImageThumbnail media={media} t={t} />
                  )
                  }
                </Grid>
              )}
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
