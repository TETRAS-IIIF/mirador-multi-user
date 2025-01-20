import { Box, Grid } from "@mui/material";
import ReactPlayer from "react-player";
import React, { useRef } from "react";

export function MediaVideoThumbnail({ media }) {

  const playerRef = useRef(null);

  if (playerRef.current) {
    console.log(playerRef.current.getInternalPlayer().thumbnail);
    console.log(playerRef.current.getDuration());
  }

  return (
    <Grid>
      {media.thumbnailUrl && (
        <Box
          component="img"
          src={media.thumbnailUrl}
          loading="lazy"
          sx={{
            width: 100,
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
          <ReactPlayer
            url={media.value}
            width={0}
            height={0}
            controls={false}
            light={true}
            playing={false}
            muted={true}
            ref={playerRef}
          />
          {playerRef.current && (
            <>
              <Box
                component="img"
                src={playerRef.current.getInternalPlayer().thumbnail}
                loading="lazy"
                sx={{
                  width: 100,
                  height: 50,
                  objectFit: "cover",
                  "@media(min-resolution: 2dppx)": {
                    width: 100,
                    height: 100
                  }
                }}
              />
              <h1>{playerRef.current.getDuration()}</h1>
            </>
          )}
        </>
      )}
    </Grid>
  );
}
