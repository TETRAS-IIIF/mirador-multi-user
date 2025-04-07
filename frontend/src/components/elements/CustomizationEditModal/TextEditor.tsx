import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'react-quill/dist/quill.bubble.css';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

interface TextEditorProps {
  textHtml: string | undefined;
  updateText: (html: string) => void;
}

const StyledReactQuill = styled(ReactQuill)(() => ({
  '.ql-editor': {
    height: '300px',
    overflowY: 'auto',
    width: '100%',
  },
}));

export const TextEditor = (
  {
    textHtml,
    updateText,
  }: TextEditorProps) => {
  const [editorHtml, setEditorHtml] = useState<string | undefined>(textHtml);
  const { t } = useTranslation();

  useEffect(() => {
    setEditorHtml(textHtml);
  }, [textHtml]);

  const handleChange = (html: string) => {
    setEditorHtml(html);
    updateText(html);
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [
        { list: 'ordered' },
        { list: 'bullet' },
        { indent: '-1' },
        { indent: '+1' },
      ],
      [{ color: [] }, { background: [] }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'color',
    'background',
  ];

  console.log('editorHtml :', editorHtml);
  console.log('modules :', modules);
  console.log('formats :', formats);
  return (
    <StyledReactQuill
      // value={editorHtml}
      onChange={handleChange}
      placeholder={t('yourTextHere')}
      // modules={modules}
      // formats={formats}
    />
  );
};
