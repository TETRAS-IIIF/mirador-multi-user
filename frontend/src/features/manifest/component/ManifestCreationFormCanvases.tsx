import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import {
  getPeerTubeThumbnailUrl,
  getPeerTubeVideoID,
  getYoutubeJson,
  isPeerTubeVideo,
  isRawVideo,
  isYouTubeVideo,
} from "../../media/utils/utils";
import { MediaTypes } from "../../media/types/types";
import { ManifestCreationFormCanvas } from "./ManifestCreationFormCanvas";
import { IIIFCanvases, MediaField } from "./ManifestCreationForm";

interface ManifestCreationFormCanvasesProps {
  canvases: IIIFCanvases[];
  t: {
    (key: string): string;
    (key: string, options?: Record<string, number>): string;
  };
  setCanvases: (canvases: IIIFCanvases[]) => void;
}

export const ManifestCreationFormCanvases = ({
  canvases,
  t,
  setCanvases,
}: ManifestCreationFormCanvasesProps) => {
  const handleMediaURLChange = async (itemIndex: number, mediaURL: string) => {
    const updatedCanvas = [...canvases];
    updatedCanvas[itemIndex].media[0].value = mediaURL;
    updatedCanvas[itemIndex].media[0].duration = undefined;
    updatedCanvas[itemIndex].media[0].height = undefined;
    updatedCanvas[itemIndex].media[0].width = undefined;

    let youtubeJson;
    let videoId;
    let thumbnailUrl: string | null = null;

    if (!mediaURL) {
      setCanvases(updatedCanvas);
      return;
    }

    try {
      //TODO : refacto order of checks to optimize and handle the case where the url doesn't contain any of these case.
      if (isRawVideo(mediaURL)) {
        updatedCanvas[itemIndex].media[0].thumbnailUrl = undefined;
        updatedCanvas[itemIndex].media[0].type = MediaTypes.VIDEO;
      } else if (isYouTubeVideo(mediaURL)) {
        youtubeJson = await getYoutubeJson(mediaURL);
        thumbnailUrl = youtubeJson?.thumbnail_url ?? null;
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

  const setMedia = (media: MediaField, canvasIndex: number) => {
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
    setCanvases([
      ...canvases,
      {
        media: [
          {
            title: `media-${newCanvasIndex}`,
            value: "",
            type: undefined,
          },
        ],
      },
    ]);
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
          handleRemoveCanvas={handleRemoveCanvas}/>
      ))}
      <Grid>
        <Button variant="contained" color="primary" onClick={handleNewCanvas}>
          {t("addNewCanvas")}
        </Button>
      </Grid>
    </>
  );
};
