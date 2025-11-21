import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';

import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';

// TinyMCE core, theme, icons, model (self-hosted, no external calls)
import 'tinymce/tinymce';
import 'tinymce/icons/default';
import 'tinymce/themes/silver';
import 'tinymce/models/dom';

// TinyMCE plugins that exist in the npm tinymce package
import 'tinymce/plugins/code';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/table';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/visualblocks';

// TinyMCE styles bundled locally
import 'tinymce/skins/ui/oxide/skin.min.css';
import 'tinymce/skins/ui/oxide/content.min.css';

import {
  AppBar,
  Box,
  Dialog,
  GlobalStyles,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SearchIcon from '@mui/icons-material/Search';
import FindReplaceIcon from '@mui/icons-material/FindReplace';
import SaveIcon from '@mui/icons-material/Save';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

interface IAdvancedTextEditorProps {
  /** Initial content for this file. Change the component `key` when you load another file. */
  value: string;
  onChange: (value: string) => void;
  language: string;
  title?: string;
  fullscreenMode?: 'dialog' | 'browser';
  onSave: (value: string) => Promise<void>;
}

export const AdvancedTextEditor = ({
  value,
  onChange,
  language,
  title = '',
  fullscreenMode = 'dialog',
  onSave,
}: IAdvancedTextEditorProps) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [localValue, setLocalValue] = useState<string>(value);
  const [lastSavedValue, setLastSavedValue] = useState<string>(value);
  const [isDirty, setIsDirty] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'code' | 'rich'>('code');

  const isHtml =
    language.toLowerCase() === 'html' || language.toLowerCase() === 'htm';
  const isCodeMode = !isHtml || editorMode === 'code';

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const undo = () => editorRef.current?.trigger('toolbar', 'undo', null);
  const redo = () => editorRef.current?.trigger('toolbar', 'redo', null);
  const search = () => editorRef.current?.getAction('actions.find')?.run();
  const replace = () =>
    editorRef.current?.getAction('editor.action.startFindReplaceAction')?.run();
  const format = () =>
    editorRef.current?.getAction('editor.action.formatDocument')?.run();

  const updateValue = (next: string) => {
    setLocalValue(next);
    onChange(next);
    setIsDirty(next !== lastSavedValue);
  };

  const handleEditorChange = (v?: string) => {
    updateValue(v ?? '');
  };

  const extractBodyHtml = (html: string): string => {
    const lower = html.toLowerCase();
    const bodyOpen = lower.indexOf('<body');
    if (bodyOpen === -1) return html;

    const openTagEnd = html.indexOf('>', bodyOpen);
    if (openTagEnd === -1) return html;

    const bodyClose = lower.lastIndexOf('</body>');
    if (bodyClose === -1 || bodyClose <= openTagEnd) return html;

    return html.slice(openTagEnd + 1, bodyClose);
  };

  // Merge edited body HTML back into the full document,
  // preserving <head>, <meta>, <script>, etc.
  const mergeBodyHtml = (fullHtml: string, newBodyHtml: string): string => {
    const lower = fullHtml.toLowerCase();
    const bodyOpen = lower.indexOf('<body');
    if (bodyOpen === -1) {
      return `<!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body>${newBodyHtml}</body>
    </html>`;
    }

    const openTagEnd = fullHtml.indexOf('>', bodyOpen);
    if (openTagEnd === -1) return fullHtml;

    const bodyClose = lower.lastIndexOf('</body>');
    if (bodyClose === -1 || bodyClose <= openTagEnd) return fullHtml;

    const before = fullHtml.slice(0, openTagEnd + 1);
    const after = fullHtml.slice(bodyClose);

    return `${before}\n${newBodyHtml}\n${after}`;
  };

  const bodyHtml = useMemo(() => extractBodyHtml(localValue), [localValue]);

  const handleTinyChange = (bodyContent: string) => {
    const nextFull = mergeBodyHtml(localValue, bodyContent);
    updateValue(nextFull);
  };

  const handleSave = async () => {
    const current = localValue;
    await onSave(current);
    setLastSavedValue(current);
    setIsDirty(false);
  };

  const toggleFullscreen = async () => {
    if (fullscreenMode === 'dialog') {
      setDialogOpen((v) => !v);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen();
  };

  const exitDialog = () => setDialogOpen(false);

  const fullscreenIcon = useMemo(
    () =>
      fullscreenMode === 'dialog' ? (
        dialogOpen ? (
          <FullscreenExitIcon />
        ) : (
          <FullscreenIcon />
        )
      ) : document.fullscreenElement ? (
        <FullscreenExitIcon />
      ) : (
        <FullscreenIcon />
      ),
    [fullscreenMode, dialogOpen],
  );

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: 'code' | 'rich' | null,
  ) => {
    if (!newMode) return;
    setEditorMode(newMode);
  };

  const Controls = () => (
    <Stack direction="row" spacing={1} alignItems="center">
      {isHtml && (
        <ToggleButtonGroup
          size="small"
          value={editorMode}
          exclusive
          onChange={handleModeChange}
        >
          {/*// TODO: This editor sanitize body html and remove <scipt></scipt>, this cause issue on some html medias.*/}
          {/*<ToggleButton value="rich">Simple</ToggleButton>*/}
          <ToggleButton value="code">Avancé</ToggleButton>
        </ToggleButtonGroup>
      )}

      {isCodeMode ? (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton size="small" onClick={undo} title="Undo">
            <UndoIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={redo} title="Redo">
            <RedoIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={search} title="Search">
            <SearchIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={replace} title="Replace">
            <FindReplaceIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={format} title="Format code">
            <AutoFixHighIcon fontSize="small" />
          </IconButton>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton
              size="small"
              onClick={handleSave}
              title={isDirty ? 'Save (unsaved changes)' : 'Save'}
              disabled={!isDirty}
            >
              <SaveIcon fontSize="small" />
            </IconButton>
            {isDirty && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                }}
                title="Unsaved changes"
              />
            )}
          </Stack>
        </Stack>
      ) : (
        // TinyMCE mode: only Save + dirty dot
        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton
            size="small"
            onClick={handleSave}
            title={isDirty ? 'Save (unsaved changes)' : 'Save'}
            disabled={!isDirty}
          >
            <SaveIcon fontSize="small" />
          </IconButton>
          {isDirty && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'error.main',
              }}
              title="Unsaved changes"
            />
          )}
        </Stack>
      )}
    </Stack>
  );

  const monacoEditor = (
    <Editor
      value={localValue}
      language={language}
      onChange={handleEditorChange}
      onMount={handleMount}
      theme="vs"
      options={{
        lineNumbers: 'on',
        minimap: { enabled: false },
        automaticLayout: true,
        wordWrap: 'on',
        smoothScrolling: true,
        renderLineHighlight: 'all',
        folding: true,
        contextmenu: true,
        tabSize: 2,
        insertSpaces: true,
      }}
    />
  );

  const tinyEditor = (
    <TinyMCEEditor
      value={bodyHtml}
      onEditorChange={handleTinyChange}
      init={{
        height: '100%',
        // @ts-expect-error-next-line
        license_key: 'gpl', // TODO Give error but fix proposed dont work
        menubar: true,
        plugins:
          'code link lists table advlist charmap anchor searchreplace visualblocks',
        toolbar:
          'undo redo | formatselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | code',
        skin: false,
        content_css: false,
        promotion: false,
      }}
    />
  );

  const editor = (
    <Box
      sx={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        '& .tox-tinymce': {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {isHtml && editorMode === 'rich' ? tinyEditor : monacoEditor}
    </Box>
  );

  const hideOuterToolbar = fullscreenMode === 'dialog' && dialogOpen;

  return (
    <Box
      ref={containerRef}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 320,
        height: '100%',
        width: '100%',
        '&:fullscreen': { width: '100vw', height: '100vh' },
      }}
    >
      <GlobalStyles
        styles={{
          '.monaco-editor, .monaco-editor .overflow-guard': {
            width: '100% !important',
            height: '100% !important',
          },
        }}
      />

      {!hideOuterToolbar && (
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar variant="dense" sx={{ gap: 1 }}>
            <Typography variant="subtitle2" sx={{ flex: 1, minWidth: 120 }}>
              {title}
            </Typography>
            <Controls />
            <IconButton
              onClick={toggleFullscreen}
              title="Fullscreen"
              sx={{ ml: 1 }}
            >
              {fullscreenIcon}
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {fullscreenMode === 'dialog' ? (
        <>
          {!dialogOpen && editor}
          <Dialog
            fullScreen
            open={dialogOpen}
            onClose={exitDialog}
            slotProps={{
              paper: {
                sx: {
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100vh',
                },
              },
            }}
          >
            <AppBar position="static">
              <Toolbar variant="dense" sx={{ gap: 1 }}>
                <Typography sx={{ flex: 1, minWidth: 120 }} variant="h6">
                  {`${title} (Fullscreen)`}
                </Typography>
                <Controls />
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={exitDialog}
                  title="Exit fullscreen"
                  sx={{ ml: 1 }}
                >
                  <FullscreenExitIcon />
                </IconButton>
              </Toolbar>
            </AppBar>
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>{editor}</Box>
          </Dialog>
        </>
      ) : (
        editor
      )}
    </Box>
  );
};
