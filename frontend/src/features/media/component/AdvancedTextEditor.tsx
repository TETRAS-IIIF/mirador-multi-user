import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
  value: string; // initial value
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
  title = 'Advanced editor',
  fullscreenMode = 'dialog',
  onSave,
}: IAdvancedTextEditorProps) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Local source of truth for content
  const [localValue, setLocalValue] = useState<string>(value);
  const savedValueRef = useRef<string>(value);
  const [isDirty, setIsDirty] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'code' | 'rich'>('code');

  const isHtml =
    language.toLowerCase() === 'html' || language.toLowerCase() === 'htm';

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

  const handleEditorChange = (v?: string) => {
    const next = v ?? '';
    setLocalValue(next);
    onChange(next);
    setIsDirty(next !== savedValueRef.current);
  };

  const handleQuillChange = (content: string) => {
    handleEditorChange(content);
  };

  const handleSave = async () => {
    const current = localValue; // always save local state
    await onSave(current);
    savedValueRef.current = current;
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

  const codeActionsDisabled =
    !editorRef.current || !isHtml || editorMode !== 'code';

  const Controls = () => (
    <Stack direction="row" spacing={1} alignItems="center">
      {isHtml && (
        <ToggleButtonGroup
          size="small"
          value={editorMode}
          exclusive
          onChange={handleModeChange}
        >
          <ToggleButton value="code">Monaco</ToggleButton>
          <ToggleButton value="rich">Quill</ToggleButton>
        </ToggleButtonGroup>
      )}

      <Stack direction="row" spacing={0.5} alignItems="center">
        <IconButton
          size="small"
          onClick={undo}
          title="Undo"
          disabled={codeActionsDisabled}
        >
          <UndoIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={redo}
          title="Redo"
          disabled={codeActionsDisabled}
        >
          <RedoIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={search}
          title="Search"
          disabled={codeActionsDisabled}
        >
          <SearchIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={replace}
          title="Replace"
          disabled={codeActionsDisabled}
        >
          <FindReplaceIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={format}
          title="Format code"
          disabled={codeActionsDisabled}
        >
          <AutoFixHighIcon fontSize="small" />
        </IconButton>
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

  const quillEditor = (
    <ReactQuill
      theme="snow"
      value={localValue}
      onChange={handleQuillChange}
      style={{ width: '100%', height: '100%' }}
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
        '& .ql-container': {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {isHtml && editorMode === 'rich' ? quillEditor : monacoEditor}
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
