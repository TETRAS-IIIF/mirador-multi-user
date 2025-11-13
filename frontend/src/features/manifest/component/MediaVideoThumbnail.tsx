import { Box, Grid } from '@mui/material';
import { useRef, useState } from 'react';
import { MediaField } from './ManifestCreationForm';
import { ThumbnailPreviewModal } from '../../../components/elements/ThumbnailPreviewModal.tsx';

interface MediaVideoThumbnailProps {
  media: MediaField;
  setMedia: (media: MediaField) => void;
}

export function MediaVideoThumbnail({
  media,
  setMedia,
}: MediaVideoThumbnailProps) {
  const videoEl = useRef<HTMLVideoElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLoadedMetadata = () => {
    const video = videoEl.current;
    if (!video) return;
    setMedia({
      ...media,
      duration: video.duration!,
      height: video.videoHeight!,
      width: video.videoWidth!,
    });
  };

  return (
    <Grid>
      {media.thumbnailUrl && (
        <Box
          component="img"
          src={media.thumbnailUrl}
          loading="lazy"
          onClick={() => setIsModalOpen(true)}
          sx={{
            width: 200,
            height: 50,
            objectFit: 'cover',
            cursor: 'pointer',
            '@media(min-resolution: 2dppx)': {
              width: 100,
              height: 100,
            },
          }}
        />
      )}

      {!media.thumbnailUrl && (
        <video
          width="200"
          ref={videoEl}
          src={media.value}
          controls
          onLoadedMetadata={handleLoadedMetadata}
        />
      )}
      <ThumbnailPreviewModal
        open={isModalOpen}
        src={media.thumbnailUrl ?? ''}
        alt="video-thumbnail"
        onClose={() => setIsModalOpen(false)}
      />
    </Grid>
  );
}
