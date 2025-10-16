import { FieldForm } from '../../../components/elements/FieldForm';
import { Button, Grid, Paper } from '@mui/material';
import { ChangeEvent, useState } from 'react';
import { MediaTypes } from '../../media/types/types';
import { MediaImageThumbnail } from './MediaImageThumbnail';
import { MediaVideoThumbnail } from './MediaVideoThumbnail';
import { IIIFCanvases, MediaField } from './ManifestCreationForm';

interface ManifestCreationFormCanvasProps {
  canvas: IIIFCanvases;
  canvasIndex: number;
  t: {
    (key: string): string;
    (key: string, options?: Record<string, number>): string;
  };

  handleMediaURLChange: (
    canvasIndex: number,
    mediaURL: string,
  ) => Promise<void>;
  handleRemoveCanvas: (canvasIndex: number) => void;
  setMedia: (media: MediaField, canvasIndex: number) => void;
}

export const ManifestCreationFormCanvas = ({
  canvas,
  canvasIndex,
  t,
  handleMediaURLChange,
  handleRemoveCanvas,
  setMedia,
}: ManifestCreationFormCanvasProps) => {
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  const onMediaURLChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const mediaURL = e.target.value;
    setIsMediaLoading(true);
    try {
      await handleMediaURLChange(canvasIndex, mediaURL);
    } finally {
      setIsMediaLoading(false);
    }
  };
  const media = canvas.media[0];

  return (
    <Grid key={canvasIndex}>
      <Paper elevation={3} sx={{ padding: 2, width: '100%' }}>
        <Grid container direction="column" spacing={2}>
          <Grid container spacing={2} alignItems="center">
            <Grid xs>
              <FieldForm
                name={media.title}
                placeholder={t('mediaLink')}
                label={t('mediaLink')}
                value={media.value}
                onChange={onMediaURLChange}/>
            </Grid>
            {isMediaLoading && <h2>Loading ...</h2>}
            {media.value && !isMediaLoading && (
              <Grid>
                {media.type === MediaTypes.VIDEO && (
                  <MediaVideoThumbnail
                    media={media}
                    setMedia={(media: MediaField) =>
                      setMedia(media, canvasIndex)
                    }/>
                )}
                {media.type === MediaTypes.IMAGE && (
                  <MediaImageThumbnail media={media} t={t}/>
                )}
              </Grid>
            )}
          </Grid>
          <Grid>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleRemoveCanvas(canvasIndex)}>
              {t('canvasRemoving', { index: canvasIndex + 1 })}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
};
