import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Editor } from "react-draft-wysiwyg";
import { ContentState, EditorState } from "draft-js";
import { useState } from "react";

export const NoteTemplate = () => {
  const [editorState, setEditorState] = useState(
    EditorState.createWithContent(ContentState.createFromText("abcde")),
  );

  return (
    <Editor
      editorState={editorState}
      onEditorStateChange={setEditorState}
      toolbar={{
        image: {
          uploadCallback: (file) =>
            new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open("POST", "https://api.imgur.com/3/image");
              xhr.setRequestHeader("Authorization", "Client-ID XXXXX");
              const data = new FormData();
              data.append("image", file);
              xhr.send(data);
              xhr.onload = () => resolve(JSON.parse(xhr.responseText));
              xhr.onerror = () => reject(JSON.parse(xhr.responseText));
            }),
          alt: { present: true, mandatory: true },
        },
      }}
    />
  );
};
