import { Box, Grid } from "@mui/material";
import React, { useRef } from "react";

export function MediaVideoThumbnail({ media }) {

  const handleLoadedMetadata = () => {
    const video = videoEl.current;
    if (!video) return;
    console.log(`The video is ${video.duration} seconds long.`);
    console.log(`The video is ${video.videoHeight} height.`);
    console.log(`The video is ${video.videoWidth} width.`);

  };

  const videoEl = useRef(null);

  return (
    <Grid>
      {media.thumbnailUrl && (
        <Box
          component="img"
          src={media.thumbnailUrl}
          loading="lazy"
          sx={{
            width: 200,
            height: 50,
            objectFit: "cover",
            "@media(min-resolution: 2dppx)": {
              width: 100,
              height: 100
            }
          }}
        />)
      }
      {!media.thumbnailUrl && (
        <>
          <video
            width="200"
            ref={videoEl}
            src={media.value}
            controls
            onLoadedMetadata={handleLoadedMetadata}

          />

        </>
      )}
    </Grid>
  );
}
