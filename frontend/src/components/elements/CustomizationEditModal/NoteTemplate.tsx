import { TextEditor } from "./TextEditor.tsx";
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SelectChangeEvent } from "@mui/material/Select";

interface NoteTemplateProps {
  templates: {
    title: string;
    content: string;
  }[];
}

export const NoteTemplate = ({ templates }: NoteTemplateProps) => {
  const { t } = useTranslation();

  const [selectedTemplate, setSelectedTemplate] = useState(
    templates.length > 0 ? templates[0] : null,
  );

  const [editorContent, setEditorContent] = useState(
    selectedTemplate ? selectedTemplate.content : "",
  );

  const handleTemplateContent = (newTextValue: string) => {
    setEditorContent(newTextValue);
  };

  const handleUpdateTemplate = () => {
    console.log(editorContent);
  };

  const handleSelectTemplate = (event: SelectChangeEvent<string>) => {
    const selected =
      templates.find((temp) => temp.title === event.target.value) || null;
    setSelectedTemplate(selected);

    setEditorContent(selected ? selected.content : "");
  };

  console.log("editorContent", editorContent);

  return (
    <Grid container spacing={1} flexDirection="column">
      <Grid item>
        <FormControl sx={{ width: "90%" }}>
          <InputLabel id="template-select-label">{t("templates")}</InputLabel>
          <Select
            labelId="template-select-label"
            value={selectedTemplate ? selectedTemplate.title : ""}
            label={t("templates")}
            onChange={handleSelectTemplate}
          >
            {templates.map((temp) => (
              <MenuItem key={temp.title} value={temp.title}>
                {temp.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item>
        <TextEditor
          textHtml={editorContent}
          updateText={handleTemplateContent}
        />
      </Grid>
      <Grid item>
        <Button
          color="primary"
          variant="contained"
          onClick={handleUpdateTemplate}
        >
          {t("updateTemplate")}
        </Button>
      </Grid>
    </Grid>
  );
};
