import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { FieldForm } from '../../../components/elements/FieldForm';
import { Box, Typography } from '@mui/material';
import { MMUToolTip } from '../../../components/elements/MMUTootlTip';
import { ChangeEvent, useState } from 'react';
import { ThumbnailPreviewModal } from '../../../components/elements/ThumbnailPreviewModal.tsx';

interface ManifestCreationFormThumbnailProps {
  manifestThumbnail: string;
  setManifestThumbnail: (manifestThumbnail: string) => void;
  t: {
    (key: string): string;
    (key: string, options?: Record<string, number>): string;
  };
}

export const ManifestCreationFormThumbnail = ({
  manifestThumbnail,
  setManifestThumbnail,
  t,
}: ManifestCreationFormThumbnailProps) => {
  const [isManifestThumbnailBadURL, setIsManifestThumbnailBadURL] =
    useState(false);
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false);

  const handleManifestThumbnailChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setManifestThumbnail(e.target.value);
  };

  return (
    <>
      <Grid container sx={{ height: '75px' }}>
        <Paper elevation={3} style={{ padding: '20px', width: '100%' }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={8}>
              <FieldForm
                name="manifest-thumbnail"
                placeholder={t('manifestThumbnailUrl')}
                label={t('manifestThumbnail')}
                value={manifestThumbnail}
                onChange={handleManifestThumbnailChange}
              />
            </Grid>

            <Grid>
              {manifestThumbnail && (
                <Box
                  component="img"
                  src={manifestThumbnail}
                  loading="lazy"
                  onError={() => setIsManifestThumbnailBadURL(true)}
                  onLoad={() => setIsManifestThumbnailBadURL(false)}
                  onClick={() =>
                    !isManifestThumbnailBadURL && setIsThumbnailModalOpen(true)
                  }
                  sx={{
                    width: 100,
                    height: 100,
                    objectFit: 'contain',
                    cursor: isManifestThumbnailBadURL ? 'default' : 'pointer',
                    '@media (min-resolution: 2dppx)': {
                      width: 100,
                      height: 100,
                    },
                  }}
                />
              )}
            </Grid>

            <Grid>
              <MMUToolTip>
                <div>
                  {t('mediaShouldBeNoMoreThan', { size: 1 })}
                  <br />
                  {t('mediaOriginInfo')}
                </div>
              </MMUToolTip>
            </Grid>

            {isManifestThumbnailBadURL && (
              <Grid>
                <Typography variant="subtitle1" color="red">
                  {t('urlIsNotValid')}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>
      <ThumbnailPreviewModal
        open={isThumbnailModalOpen}
        src={manifestThumbnail}
        alt={t('manifestThumbnail')}
        onClose={() => setIsThumbnailModalOpen(false)}
      />
    </>
  );
};
