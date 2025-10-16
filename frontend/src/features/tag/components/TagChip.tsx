import { Chip } from "@mui/material";
import { Tag } from "../type.ts";

interface TagChipProps {
  tag: Tag;
  handleRemoveTag?: (title: string) => void;
  onClick?: () => void;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning";
}

export const TagChip = ({
  tag,
  handleRemoveTag,
  onClick,
  color,
}: TagChipProps) => {
  return handleRemoveTag ? (
    <Chip label={tag.title} onDelete={() => handleRemoveTag(tag.title)}/>
  ) : (
    <Chip
      label={tag.title}
      onClick={onClick}
      color={color ? color : "default"}/>
  );
};
