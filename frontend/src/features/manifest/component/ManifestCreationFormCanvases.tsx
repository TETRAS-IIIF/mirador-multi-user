import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import { FieldForm } from "../../../components/elements/FieldForm";
import { Box } from "@mui/material";
import Button from "@mui/material/Button";
import {
  getPeerTubeThumbnailUrl,
  getPeerTubeVideoID,
  getYoutubeJson,
  isPeerTubeVideo,
  isYouTubeVideo
} from "../../media/utils/utils";
import { MediaTypes } from "../../media/types/types";

export const ManifestCreationFormCanvases =
  ({
     canvases,
     t,
     setCanvases
   }) => {

    const handleMediaChange = async (itemIndex: number, mediaURL: string) => {
      const updatedCanvas = [...canvases];
      updatedCanvas[itemIndex].media[0].value = mediaURL;

      let youtubeJson;
      let videoId;
      let thumbnailUrl: string | null = null;

      try {
        if (isYouTubeVideo(mediaURL)) {
          youtubeJson = await getYoutubeJson(mediaURL);
          thumbnailUrl = youtubeJson?.thumbnail_url || null;
          updatedCanvas[itemIndex].media[0].thumbnailUrl = thumbnailUrl!;
          updatedCanvas[itemIndex].media[0].type = MediaTypes.VIDEO;
        } else if (await isPeerTubeVideo(mediaURL)) {
          videoId = getPeerTubeVideoID(mediaURL);
          if (videoId) {
            thumbnailUrl = await getPeerTubeThumbnailUrl(mediaURL, videoId);
            updatedCanvas[itemIndex].media[0].thumbnailUrl = thumbnailUrl;
            updatedCanvas[itemIndex].media[0].type = MediaTypes.VIDEO;
          }
        } else {
          // Set as image if not YouTube or PeerTube video
          updatedCanvas[itemIndex].media[0].thumbnailUrl = mediaURL;
          updatedCanvas[itemIndex].media[0].type = MediaTypes.IMAGE;
        }
      } catch (error) {
        console.error("Failed to fetch media details:", error);
      } finally {
        setCanvases(updatedCanvas);
      }
    };

    const handleRemoveCanvas = (itemIndex: number) => {
      const updatedItems = canvases.filter((_, i) => i !== itemIndex);
      setCanvases(updatedItems);
    };

    const handleNewCanvas = () => {
      const newCanvasIndex = canvases.length + 1;
      setCanvases([...canvases, { media: [{ title: `media-${newCanvasIndex}`, value: "", type: undefined }] }]);
    };

    return (
      <>
        {canvases.map((item, itemIndex) => (
          <Grid item key={itemIndex}>
            <Paper elevation={3} style={{ padding: "20px", width: "100%" }}>
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
                          objectFit: "cover",
                          "@media(min-resolution: 2dppx)": {
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
                    onClick={() => handleRemoveCanvas(itemIndex)}
                  >
                    Remove Canvas {itemIndex + 1}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}
        <Grid item>
          <Button variant="contained" color="primary" onClick={handleNewCanvas}>
            {t("add_new_canvas")}
          </Button>
        </Grid>
      </>
    );
  };
