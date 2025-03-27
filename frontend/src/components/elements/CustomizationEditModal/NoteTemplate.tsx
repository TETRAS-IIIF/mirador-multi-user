import { TextEditor } from "./TextEditor.tsx";
import { Grid } from "@mui/material";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import { useState } from "react";

interface NoteTemplateProps {
  template: string;
  updateTemplate: (newTemplate: string) => Promise<void>;
}

export const NoteTemplate = ({
  template,
  updateTemplate,
}: NoteTemplateProps) => {
  const { t } = useTranslation();

  console.log("NoteTemplate.tsx: template: ", template);

  const [editorContent, setEditorContent] = useState<string>(template);

  return (
    <Grid
      container
      spacing={2}
      flexDirection="column"
      sx={{ display: "flex", marginTop: 1, width: "100%" }}
    >
      <Grid item>
        <TextEditor textHtml={editorContent} updateText={setEditorContent} />
      </Grid>
      <Grid item>
        <Button
          variant="contained"
          onClick={() => updateTemplate(editorContent)}
        >
          {t("saveTemplate")}
        </Button>
      </Grid>
    </Grid>
  );
};
