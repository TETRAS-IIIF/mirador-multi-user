import { ChangeEvent, useState } from "react";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import { FieldForm } from "../../../components/elements/FieldForm.tsx";
import { MediaTypes } from "../../media/types/types.ts";
import { ManifestCreationFormCanvases } from "./ManifestCreationFormCanvases.tsx";
import { ManifestCreationFormThumbnail } from "./ManifestCreationFormThumbnail.tsx";

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
  handleSubmit: (manifestThumbnail: string, manifestTitle: string, manifestCanvases: iIIFCanvases[]) => void;
}

export const ManifestCreationForm = ({ handleSubmit, t }: IManifestCreationFormProps) => {
  const [manifestTitle, setManifestTitle] = useState<string>("");
  const [manifestThumbnail, setManifestThumbnail] = useState<string>("");
  const [manifestCanvases, setManifestCanvases] = useState<iIIFCanvases[]>([]);

  const handleManifestTitleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setManifestTitle(e.target.value);
  };

  return (
    <Grid container direction="column" spacing={4}>
      <Grid item container>
        <Paper elevation={3} style={{ padding: "20px", width: "100%" }}>
          <Grid item>
            <FieldForm
              name="manifest-title"
              placeholder={t("manifestTitle")}
              label={t("manifestTitle")}
              value={manifestTitle}
              onChange={handleManifestTitleChange}
            />
          </Grid>
        </Paper>
      </Grid>
      <ManifestCreationFormThumbnail
        manifestThumbnail={manifestThumbnail}
        setManifestThumbnail={setManifestThumbnail}
        t={t}
      />
      <ManifestCreationFormCanvases
        canvases={manifestCanvases}
        t={t}
        setCanvases={setManifestCanvases}
      />
      <Grid item>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleSubmit(manifestThumbnail, manifestTitle, manifestCanvases)}
          disabled={manifestCanvases.length < 1}
        >
          {t("actionsDial.create")}
        </Button>
      </Grid>
    </Grid>
  );
};
