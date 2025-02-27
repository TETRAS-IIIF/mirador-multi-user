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
import { ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { SelectChangeEvent } from "@mui/material/Select";
import { Project, Template } from "../../../features/projects/types/types.ts";
import { updateProject } from "../../../features/projects/api/updateProject.ts";

interface NoteTemplateProps {
  project: Project;
}

export const NoteTemplate = ({ project }: NoteTemplateProps) => {
  const { t } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { rights, ...userProject } = project;

  const [templates, setTemplates] = useState<Template[]>(
    project.noteTemplate ? project.noteTemplate : [],
  );
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

  const handleUpdateTemplate = async () => {
    if (isNewTemplate) {
      const updatedTemplateList = [
        ...templates,
        { title, content: editorContent },
      ];
      await updateProject({
        id: project.id,
        project: {
          ...userProject,
          noteTemplate: updatedTemplateList,
        },
      });
      setTemplates(updatedTemplateList);
      setIsNewTemplate(false);
    } else {
      const updatedTemplateList = templates.map((temp) =>
        temp.title === selectedTemplate?.title
          ? { ...temp, title, content: editorContent }
          : temp,
      );
      await updateProject({
        id: userProject.id,
        project: {
          ...userProject,
          noteTemplate: updatedTemplateList,
        },
      });
      setTemplates(updatedTemplateList);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    const updatedTemplateList = templates.filter(
      (temp) => temp.title !== selectedTemplate.title,
    );
    await updateProject({
      id: userProject.id,
      project: {
        ...userProject,
        noteTemplate: updatedTemplateList,
      },
    });

    setTemplates(updatedTemplateList);
    setSelectedTemplate(null);
    setTitle("");
    setEditorContent("");
  };

  const handleSelectTemplate = (event: SelectChangeEvent<string>) => {
    const selected =
      templates.find((temp) => temp.title === event.target.value) || null;
    setSelectedTemplate(selected);
    setIsNewTemplate(false);
    setTitle(selected ? selected.title : "");
    setEditorContent(selected ? selected.content : "");
  };

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleCreateNewTemplate = () => {
    setSelectedTemplate(null);
    setIsNewTemplate(true);
    setTitle(t("newTemplate"));
    setEditorContent("");
  };

  return (
    <Grid
      container
      spacing={2}
      flexDirection="column"
      sx={{ display: "flex", marginTop: 1 }}
    >
      <Grid
        item
        container
        spacing={1}
        alignItems="center"
        flexDirection="column"
      >
        <Grid
          item
          container
          flexDirection="row"
          alignItems="center"
          spacing={1}
        >
          <Grid item>
            <FormControl sx={{ width: "400px" }}>
              <InputLabel id="template-select-label">
                {t("templates")}
              </InputLabel>
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
          <Grid
            item
            container
            flexDirection="column"
            spacing={1}
            sx={{ flex: 1, display: "flex", height: "100%" }}
          >
            <Grid item>
              <TextField
                fullWidth
                label={t("title")}
                value={title}
                onChange={handleTitleChange}
              />
            </Grid>
            <Grid item sx={{ minHeight: "200px", maxHeight: "400px" }}>
              <TextEditor
                textHtml={editorContent}
                updateText={handleTemplateContent}
              />
            </Grid>
          </Grid>
        )}
        <Grid
          item
          container
          sx={{
            mt: "auto",
            display: "flex",
            justifyContent: "space-between",
            backGround: "white",
          }}
        >
          <Grid item>
            <Button
              color="error"
              variant="contained"
              onClick={handleDeleteTemplate}
              disabled={!selectedTemplate}
            >
              {t("deleteTemplate")}
            </Button>
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
      </Grid>
    </Grid>
  );
};
