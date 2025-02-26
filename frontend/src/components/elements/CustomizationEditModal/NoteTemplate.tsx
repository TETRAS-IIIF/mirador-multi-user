import { TextEditor } from "./TextEditor.tsx";
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SelectChangeEvent } from "@mui/material/Select";

interface Template {
  title: string;
  content: string;
}

interface NoteTemplateProps {
  templates: Template[];
}

export const NoteTemplate = ({
  templates: initialTemplates,
}: NoteTemplateProps) => {
  const { t } = useTranslation();

  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    templates.length > 0 ? templates[0] : null,
  );

  const [title, setTitle] = useState(
    selectedTemplate ? selectedTemplate.title : "",
  );
  const [editorContent, setEditorContent] = useState(
    selectedTemplate ? selectedTemplate.content : "",
  );

  const [isNewTemplate, setIsNewTemplate] = useState(false);

  const handleTemplateContent = (newTextValue: string) => {
    setEditorContent(newTextValue);
  };

  const handleUpdateTemplate = () => {
    if (isNewTemplate) {
      setTemplates((prevTemplates) => [
        ...prevTemplates,
        { title, content: editorContent },
      ]);
      setIsNewTemplate(false);
    } else {
      setTemplates((prevTemplates) =>
        prevTemplates.map((temp) =>
          temp.title === selectedTemplate?.title
            ? { ...temp, title, content: editorContent }
            : temp,
        ),
      );
    }
  };

  const handleSelectTemplate = (event: SelectChangeEvent<string>) => {
    const selected =
      templates.find((temp) => temp.title === event.target.value) || null;
    setSelectedTemplate(selected);
    setIsNewTemplate(false);

    setTitle(selected ? selected.title : "");
    setEditorContent(selected ? selected.content : "");
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleCreateNewTemplate = () => {
    setSelectedTemplate(null);
    setIsNewTemplate(true);
    setTitle(t("newTemplate"));
    setEditorContent("");
  };

  return (
    <Grid container spacing={2} flexDirection="column">
      <Grid item container spacing={1} alignItems="center">
        <Grid item xs={9}>
          <FormControl fullWidth>
            <InputLabel id="template-select-label">{t("templates")}</InputLabel>
            <Select
              labelId="template-select-label"
              value={selectedTemplate ? selectedTemplate.title : ""}
              label={t("templates")}
              onChange={handleSelectTemplate}
              displayEmpty
            >
              {templates.map((temp) => (
                <MenuItem key={temp.title} value={temp.title}>
                  {temp.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={3} display="flex" justifyContent="flex-end">
          <Button
            color="primary"
            variant="outlined"
            onClick={handleCreateNewTemplate}
          >
            {t("createNewTemplate")}
          </Button>
        </Grid>
      </Grid>

      {(selectedTemplate || isNewTemplate) && (
        <>
          <Grid item>
            <TextField
              fullWidth
              label={t("title")}
              value={title}
              onChange={handleTitleChange}
            />
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
        </>
      )}
    </Grid>
  );
};
