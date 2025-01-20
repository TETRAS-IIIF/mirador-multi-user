import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import {
  getPeerTubeThumbnailUrl,
  getPeerTubeVideoID,
  getYoutubeJson,
  isPeerTubeVideo,
  isYouTubeVideo
} from "../../media/utils/utils";
import { MediaTypes } from "../../media/types/types";
import { ManifestCreationFormCanvas } from "./ManifestCreationFormCanvas";

export const ManifestCreationFormCanvases =
  ({
     canvases,
     t,
     setCanvases
   }) => {

    const handleMediaURLChange = async (itemIndex: number, mediaURL: string) => {
      const updatedCanvas = [...canvases];
      updatedCanvas[itemIndex].media[0].value = mediaURL;

      let youtubeJson;
      let videoId;
      let thumbnailUrl: string | null = null;

      if (!mediaURL) {
        setCanvases(updatedCanvas);
        return;
      }

      try {
        if (mediaURL.match(/\.(mp4|webm|ogg)$/i) !== null) {
          updatedCanvas[itemIndex].media[0].thumbnailUrl = null;
          updatedCanvas[itemIndex].media[0].type = MediaTypes.VIDEO;
        } else if (isYouTubeVideo(mediaURL)) {
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
          // Set as image if not YouTube or PeerTube video or video classic file format
          updatedCanvas[itemIndex].media[0].thumbnailUrl = mediaURL;
          updatedCanvas[itemIndex].media[0].type = MediaTypes.IMAGE;
        }
      } catch (error) {
        console.error("Failed to fetch media details:", error);
      } finally {
        setCanvases(updatedCanvas);
      }
    };

    const setMedia = (media, canvasIndex) => {
      const updatedCanvas = [...canvases];
      updatedCanvas[canvasIndex].media[0] = media;
      setCanvases([...updatedCanvas]);
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
        {canvases.map((canvas, canvasIndex) => (
          <ManifestCreationFormCanvas
            key={canvasIndex}
            canvas={canvas}
            canvasIndex={canvasIndex}
            t={t}
            setMedia={setMedia}
            handleMediaURLChange={handleMediaURLChange}
            handleRemoveCanvas={handleRemoveCanvas}
          />
        ))}
        <Grid item>
          <Button variant="contained" color="primary" onClick={handleNewCanvas}>
            {t("addNewCanvas")}
          </Button>
        </Grid>
      </>
    );
  };
