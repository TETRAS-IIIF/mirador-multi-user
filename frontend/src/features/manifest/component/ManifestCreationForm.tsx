import { ChangeEvent, useState } from "react";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import { FieldForm } from "../../../components/elements/FieldForm.tsx";
import { Box, Typography } from "@mui/material";
import { MMUToolTip } from "../../../components/elements/MMUTootlTip.tsx";
import { MediaTypes } from "../../media/types/types.ts";
import { ManifestCreationFormCanvases } from "./ManifestCreationFormCanvases.tsx";

interface MediaField {
  title: string;
  value: string;
  type: MediaTypes | undefined;
  thumbnailUrl?: string;
}

interface iIIFCanvases {
  media: MediaField[];
}

interface IManifestCreationFormProps {
  handleSubmit: (manifestThumbnail: string, manifestTitle: string, items: any) => void;
}

export const ManifestCreationForm = ({ handleSubmit, t }: IManifestCreationFormProps) => {
  const [manifestTitle, setManifestTitle] = useState<string>("");
  const [manifestThumbnail, setManifestThumbnail] = useState<string>("");
  const [canvases, setCanvases] = useState<iIIFCanvases[]>([]);
  const [isManifestThumbnailBadURL, setIsManifestThumbnailBadURL] = useState(false);


  const handleManifestTitleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setManifestTitle(e.target.value);
  };

  const handleManifestThumbnailChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setManifestThumbnail(e.target.value);
  };


  return (
    <Grid container direction="column" spacing={4}>
      <Grid item container>
        <Paper elevation={3} style={{ padding: "20px", width: "100%" }}>
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
        <Paper elevation={3} style={{ padding: "20px", width: "100%" }}>
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
                  onError={() => setIsManifestThumbnailBadURL(true)}
                  onLoad={() => setIsManifestThumbnailBadURL(false)}
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
            {isManifestThumbnailBadURL && (
              <Grid item>
                <Typography variant="subtitle1" color="red">
                  URL is not valid
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>
      <ManifestCreationFormCanvases
        canvases={canvases} setCanvases={setCanvases}
        t={t}
      />

      <Grid item>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleSubmit(manifestThumbnail, manifestTitle, canvases)}
          disabled={canvases.length < 1}
        >
          Create
        </Button>
      </Grid>
    </Grid>
  );
};
