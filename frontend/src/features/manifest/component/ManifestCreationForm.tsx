import { ChangeEvent, useState } from 'react';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { FieldForm } from '../../../components/elements/FieldForm.tsx';
import { Box, Typography } from '@mui/material';
import { MMUToolTip } from '../../../components/elements/MMUTootlTip.tsx';
import { MediaTypes } from '../../media/types/types.ts';
import {
  getPeerTubeThumbnailUrl,
  getPeerTubeVideoID,
  getYoutubeJson,
  isPeerTubeVideo,
  isYouTubeVideo
} from '../../media/utils/utils.ts';

interface MediaField {
  title: string;
  value: string;
  type: MediaTypes | undefined;
  thumbnailUrl?: string;
}

interface ItemGroup {
  media: MediaField[];
}

interface IManifestCreationFormProps {
  handleSubmit: (manifestThumbnail: string, manifestTitle: string, items: any) => void;
}

export const ManifestCreationForm = ({ handleSubmit }: IManifestCreationFormProps) => {
  const [manifestTitle, setManifestTitle] = useState<string>('');
  const [manifestThumbnail, setManifestThumbnail] = useState<string>('');
  const [items, setItems] = useState<ItemGroup[]>([]);
  const [warningWrongUrl, setWarningWrongUrl] = useState(false);

  const handleNewItemGroup = () => {
    const newCanvasIndex = items.length + 1;
    setItems([...items, { media: [{ title: `media-${newCanvasIndex}`, value: '', type: undefined }] }]);
  };

  const handleManifestTitleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setManifestTitle(e.target.value);
  };

  const handleManifestThumbnailChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setManifestThumbnail(e.target.value);
  };

  const handleMediaChange = async (itemIndex: number, value: string) => {
    const updatedItems = [...items];
    updatedItems[itemIndex].media[0].value = value;

    let youtubeJson;
    let videoId;
    let thumbnailUrl: string | null = null;

    try {
      if (isYouTubeVideo(value)) {
        youtubeJson = await getYoutubeJson(value);
        thumbnailUrl = youtubeJson?.thumbnail_url || null;
        updatedItems[itemIndex].media[0].thumbnailUrl = thumbnailUrl!;
        updatedItems[itemIndex].media[0].type = MediaTypes.VIDEO;
      } else if (await isPeerTubeVideo(value)) {
        videoId = getPeerTubeVideoID(value);
        if (videoId) {
          thumbnailUrl = await getPeerTubeThumbnailUrl(value, videoId);
          updatedItems[itemIndex].media[0].thumbnailUrl = thumbnailUrl;
          updatedItems[itemIndex].media[0].type = MediaTypes.VIDEO;
        }
      } else {
        // Set as image if not YouTube or PeerTube video
        updatedItems[itemIndex].media[0].thumbnailUrl = value;
        updatedItems[itemIndex].media[0].type = MediaTypes.IMAGE;
      }
    } catch (error) {
      console.error('Failed to fetch media details:', error);
    } finally {
      setItems(updatedItems);
    }
  };

  const handleRemoveItem = (itemIndex: number) => {
    const updatedItems = items.filter((_, i) => i !== itemIndex);
    setItems(updatedItems);
  };
  return (
    <Grid container direction="column" spacing={4}>
      <Grid item container>
        <Paper elevation={3} style={{ padding: '20px', width: '100%' }}>
          <Grid item>
            <FieldForm
              name="manifest-title"
              placeholder="Enter manifest title"
              label="Manifest Title"
              value={manifestTitle}
              onChange={handleManifestTitleChange}
            />
          </Grid>
        </Paper>
      </Grid>
      <Grid item container>
        <Paper elevation={3} style={{ padding: '20px', width: '100%' }}>
          <Grid item container spacing={4} alignItems="center">
            <Grid item xs={8}>
              <FieldForm
                name="manifest-thumbnail"
                placeholder="Manifest thumbnail URL"
                label="Manifest Thumbnail"
                value={manifestThumbnail}
                onChange={handleManifestThumbnailChange}
              />
            </Grid>
            <Grid item>
              {manifestThumbnail && (
                <Box
                  component="img"
                  src={manifestThumbnail}
                  loading="lazy"
                  onError={() => setWarningWrongUrl(true)}
                  onLoad={() => setWarningWrongUrl(false)}
                  sx={{
                    width: 50,
                    height: 50,
                    objectFit: 'cover',
                    '@media(min-resolution: 2dppx)': {
                      width: 100,
                      height: 100
                    }
                  }}
                />
              )}
            </Grid>
            <Grid item>
              <MMUToolTip>
                <div>
                  Media shouldn't weigh more than 1MB.
                  <br />
                  If the URL comes from your media library, we took care of this for you.
                </div>
              </MMUToolTip>
            </Grid>
            {warningWrongUrl && (
              <Grid item>
                <Typography variant="subtitle1" color="red">
                  URL is not valid
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>
      {items.map((item, itemIndex) => (
        <Grid item key={itemIndex}>
          <Paper elevation={3} style={{ padding: '20px', width: '100%' }}>
            <Grid container direction="column" spacing={2}>
              <Grid item container spacing={2} alignItems="center">
                <Grid item xs>
                  <FieldForm
                    name={item.media[0].title}
                    placeholder="Media URL"
                    label="Media URL"
                    value={item.media[0].value}
                    onChange={(e) => handleMediaChange(itemIndex, e.target.value)}
                  />
                </Grid>
                {item.media[0].value && (
                  <Grid item>
                    <Box
                      component="img"
                      src={item.media[0].thumbnailUrl}
                      loading="lazy"
                      sx={{
                        width: 50,
                        height: 50,
                        objectFit: 'cover',
                        '@media(min-resolution: 2dppx)': {
                          width: 100,
                          height: 100
                        }
                      }}
                    />
                  </Grid>
                )}
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleRemoveItem(itemIndex)}
                >
                  Remove Canvas {itemIndex + 1}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      ))}
      <Grid item>
        <Button variant="contained" color="primary" onClick={handleNewItemGroup}>
          Add New Canvas
        </Button>
      </Grid>
      <Grid item>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleSubmit(manifestThumbnail, manifestTitle, items)}
          disabled={items.length < 1}
        >
          Create
        </Button>
      </Grid>
    </Grid>
  );
};
