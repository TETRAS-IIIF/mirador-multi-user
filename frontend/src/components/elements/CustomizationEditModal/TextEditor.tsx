import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

interface TextEditorProps {
  textHtml: string | undefined;
  updateText: (html: string) => void;
}

const StyledReactQuill = styled(ReactQuill)(() => ({
  ".ql-editor": {
    minHeight: "150px",
    width: "100%",
  },
}));

export const TextEditor: React.FC<TextEditorProps> = ({
  textHtml,
  updateText,
}) => {
  const [editorHtml, setEditorHtml] = useState<string | undefined>(textHtml);
  const { t } = useTranslation();

  useEffect(() => {
    setEditorHtml(textHtml);
  }, [textHtml]);

  const handleChange = (html: string) => {
    setEditorHtml(html);
    updateText(html);
  };

  return (
    <StyledReactQuill
      value={editorHtml}
      onChange={handleChange}
      placeholder={t("yourTextHere")}
    />
  );
};
