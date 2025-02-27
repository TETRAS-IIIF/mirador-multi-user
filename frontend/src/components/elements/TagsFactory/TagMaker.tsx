import { ChangeEvent, KeyboardEvent, useState } from "react";
import { Box, Button, Chip, TextField } from "@mui/material";
import { updateProject } from "../../../features/projects/api/updateProject.ts";
import { Project } from "../../../features/projects/types/types.ts";
import { useTranslation } from "react-i18next";

interface TagMakerProps {
  project: Project;
}

export const TagMaker = ({ project }: TagMakerProps) => {
  const [tags, setTags] = useState<string[]>(project.tags ? project.tags : []);
  const [inputValue, setInputValue] = useState("");
  const { t } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { rights, ...userProject } = project;

  const handleAddTag = async () => {
    if (inputValue.trim() !== "" && !tags.includes(inputValue.trim())) {
      await updateProject({
        id: userProject.id,
        project: {
          ...userProject,
          tags: [...tags, inputValue.trim()],
        },
      });
      setTags([...tags, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await handleAddTag();
    }
  };

  const handleDeleteTag = async (tagToDelete: string) => {
    const updatedListOfTags = tags.filter((tag) => tag !== tagToDelete);
    await updateProject({
      id: userProject.id,
      project: {
        ...userProject,
        tags: [...updatedListOfTags],
      },
    });
    setTags(updatedListOfTags);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box
        sx={{ display: "flex", gap: 1, justifyContent: "center", marginTop: 2 }}
      >
        <TextField
          label={t("addTag")}
          variant="outlined"
          value={inputValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setInputValue(e.target.value)
          }
          onKeyDown={handleKeyDown}
        />
        <Button
          variant="contained"
          onClick={handleAddTag}
          disabled={!inputValue.trim()}
        >
          {t("addTag")}
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, maxWidth: "100%" }}>
        {tags.map((tag, index) => (
          <Chip
            key={index}
            label={tag}
            onDelete={() => handleDeleteTag(tag)}
            color="primary"
            variant="outlined"
            sx={{
              maxWidth: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          />
        ))}
      </Box>
    </Box>
  );
};
