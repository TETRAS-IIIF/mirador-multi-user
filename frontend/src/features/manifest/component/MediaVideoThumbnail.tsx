import { Box, Grid } from '@mui/material';
import React, { useRef } from 'react';

export function MediaVideoThumbnail({ media, setMedia }) {

  const handleLoadedMetadata = () => {
    const video = videoEl.current;
    if (!video) return;
    setMedia({
      ...media,
      duration: video.duration,
      height: video.videoHeight,
      width: video.videoWidth,
    });
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
            objectFit: 'cover',
            '@media(min-resolution: 2dppx)': {
              width: 100,
              height: 100,
            },
          }}
        />)
      }
      {!media.thumbnailUrl && (
        <video
          width="200"
          ref={videoEl}
          src={media.value}
          controls
          onLoadedMetadata={handleLoadedMetadata}
        />
      )}
    </Grid>
  );
}
