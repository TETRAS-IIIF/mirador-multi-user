import { useMemo, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import {
  AppBar,
  Box,
  Dialog,
  GlobalStyles,
  IconButton,
  Stack,
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
  title = 'Advanced editor',
  fullscreenMode = 'dialog',
  onSave,
}: IAdvancedTextEditorProps) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const undo = () => editorRef.current?.trigger('toolbar', 'undo', null);
  const redo = () => editorRef.current?.trigger('toolbar', 'redo', null);
  const search = () => editorRef.current?.getAction('actions.find')?.run();
  const replace = () =>
    editorRef.current?.getAction('editor.action.startFindReplaceAction')?.run();

  // Autoformat
  const format = () =>
    editorRef.current?.getAction('editor.action.formatDocument')?.run();

  const handleSave = async () => {
    const current = editorRef.current?.getValue() ?? value;
    onChange(current);
    await onSave(current);
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

  const Controls = () => (
    <Stack direction="row" spacing={0.5}>
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
      <IconButton size="small" onClick={handleSave} title="Save">
        <SaveIcon fontSize="small" />
      </IconButton>
    </Stack>
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
      }}
    >
      <Editor
        value={value}
        language={language}
        onChange={(v) => onChange(v ?? '')}
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
