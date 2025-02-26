import { TextEditor } from "./TextEditor.tsx";
import { Grid } from "@mui/material";

export const NoteTemplate = () => {
  const handleUpdateAnnotationBody = (newTextValue: string) => {
    console.log(newTextValue);
  };

  return (
    <Grid container spacing={2}>
      <TextEditor
        annoHtml={""}
        updateAnnotationBody={handleUpdateAnnotationBody}
      />
    </Grid>
  );
};
