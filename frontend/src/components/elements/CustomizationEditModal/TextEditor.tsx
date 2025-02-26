import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { styled } from "@mui/material/styles";
import { Grid } from "@mui/material";

interface TextEditorProps {
  annoHtml: string;
  updateAnnotationBody: (html: string) => void;
}

const StyledReactQuill = styled(ReactQuill)(() => ({
  ".ql-editor": {
    minHeight: "150px",
    width: "100%",
  },
}));

export const TextEditor: React.FC<TextEditorProps> = ({
  annoHtml,
  updateAnnotationBody,
}) => {
  const [editorHtml, setEditorHtml] = useState<string>(annoHtml);

  const handleChange = (html: string) => {
    setEditorHtml(html);
    updateAnnotationBody(html);
  };

  return (
    <Grid item data-testid="textEditor" sx={{ width: "100%" }}>
      <StyledReactQuill
        value={editorHtml}
        onChange={handleChange}
        placeholder="Your text here"
      />
    </Grid>
  );
};
