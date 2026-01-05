import { useMemo, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';

import {
  Alert,
  AppBar,
  Box,
  Dialog,
  Divider,
  GlobalStyles,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
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
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import HighlightIcon from '@mui/icons-material/Highlight';
import { useTranslation } from 'react-i18next';

interface IAdvancedTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  title?: string;
  fullscreenMode?: 'dialog' | 'browser';
  onSave: (value: string) => Promise<void>;
  highlightColors?: Array<{ name: string; className: string; color: string }>;
}

export const AdvancedTextEditor = ({
  value,
  onChange,
  language,
  title = '',
  fullscreenMode = 'dialog',
  onSave,
  highlightColors = [
    { name: 'Yellow', className: 'highlight-yellow', color: '#ffeb3b' },
    { name: 'Green', className: 'highlight-green', color: '#4caf50' },
    { name: 'Blue', className: 'highlight-blue', color: '#2196f3' },
    { name: 'Red', className: 'highlight-red', color: 'red' },
    { name: 'Orange', className: 'highlight-orange', color: '#ff9800' },
  ],
}: IAdvancedTextEditorProps) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [localValue, setLocalValue] = useState<string>(value);
  const [lastSavedValue, setLastSavedValue] = useState<string>(value);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [highlightMenuAnchor, setHighlightMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { t } = useTranslation();

  const isHtmlFile = language.toLowerCase() === 'html';

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.updateOptions({ fontSize: fontSize });
  };

  const undo = () => editorRef.current?.trigger('toolbar', 'undo', null);
  const redo = () => editorRef.current?.trigger('toolbar', 'redo', null);
  const search = () => editorRef.current?.getAction('actions.find')?.run();
  const replace = () =>
    editorRef.current?.getAction('editor.action.startFindReplaceAction')?.run();
  const format = () =>
    editorRef.current?.getAction('editor.action.formatDocument')?.run();

  const zoomIn = () => {
    setFontSize((prev) => {
      const newSize = Math.min(prev + 1, 32);
      editorRef.current?.updateOptions({ fontSize: newSize });
      return newSize;
    });
  };

  const zoomOut = () => {
    setFontSize((prev) => {
      const newSize = Math.max(prev - 1, 6);
      editorRef.current?.updateOptions({ fontSize: newSize });
      return newSize;
    });
  };

  const updateValue = (next: string) => {
    setLocalValue(next);
    onChange(next);
    setIsDirty(next !== lastSavedValue);
  };

  const handleEditorChange = (v?: string) => {
    updateValue(v ?? '');
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

  /**
   * Validates if the selected text is pure text content (not HTML tags/attributes)
   */
  const isValidTextSelection = (
    selectedText: string,
  ): { valid: boolean; reason?: string } => {
    // Check if empty
    if (!selectedText || selectedText.trim().length === 0) {
      return { valid: false, reason: 'No text selected' };
    }

    // Check if selection contains HTML tags (< or >)
    if (selectedText.includes('<') || selectedText.includes('>')) {
      return {
        valid: false,
        reason:
          'Selection contains HTML tags. Please select only text content.',
      };
    }

    // Check if selection contains attribute-like patterns (= or quotes commonly used in attributes)
    const attributePattern = /\s*=\s*["']/;
    if (attributePattern.test(selectedText)) {
      return {
        valid: false,
        reason: 'Selection appears to contain HTML attributes.',
      };
    }

    // Check if the selection is already wrapped in a span (to avoid nested spans)
    // This is a basic check - you might want to make it more sophisticated
    if (
      selectedText.trim().startsWith('<span') &&
      selectedText.trim().endsWith('</span>')
    ) {
      return { valid: false, reason: 'Text is already highlighted.' };
    }

    return { valid: true };
  };

  /**
   * Gets the full line context to check if selection is within tag content
   */
  const isSelectionInTextContent = (
    model: monaco.editor.ITextModel,
    selection: monaco.Selection,
  ): { valid: boolean; reason?: string } => {
    const startLine = selection.startLineNumber;

    // Get the full context (from start to selection start, and from selection end to end)
    const beforeSelection = model.getValueInRange({
      startLineNumber: startLine,
      startColumn: 1,
      endLineNumber: selection.startLineNumber,
      endColumn: selection.startColumn,
    });

    // Count opening and closing tags before the selection
    const openTagsBefore = (beforeSelection.match(/</g) || []).length;
    const closeTagsBefore = (beforeSelection.match(/>/g) || []).length;

    // If we're inside a tag (more < than >), we're not in text content
    if (openTagsBefore > closeTagsBefore) {
      return {
        valid: false,
        reason:
          'Selection is inside an HTML tag. Please select text content only.',
      };
    }

    // Check if we're in an attribute by looking for the last < before selection
    const lastOpenTag = beforeSelection.lastIndexOf('<');
    const lastCloseTag = beforeSelection.lastIndexOf('>');

    if (lastOpenTag > lastCloseTag) {
      // We're potentially inside a tag
      const tagContent = beforeSelection.substring(lastOpenTag);

      // Check if there's an = sign (attribute)
      if (tagContent.includes('=')) {
        return { valid: false, reason: 'Selection is in an HTML attribute.' };
      }

      return { valid: false, reason: 'Selection is inside an HTML tag.' };
    }

    // Additional check: ensure we're not selecting across multiple text nodes with tags
    const selectedText = model.getValueInRange(selection);
    if (selectedText.includes('<') || selectedText.includes('>')) {
      return { valid: false, reason: 'Selection spans across HTML tags.' };
    }

    return { valid: true };
  };

  const handleHighlightClick = (event: React.MouseEvent<HTMLElement>) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    if (!selection || selection.isEmpty()) {
      setErrorMessage('Please select some text first');
      return;
    }

    const model = editor.getModel();
    if (!model) return;

    const selectedText = model.getValueInRange(selection);

    // Validate the selected text
    const textValidation = isValidTextSelection(selectedText);
    if (!textValidation.valid) {
      setErrorMessage(textValidation.reason || 'Invalid selection');
      return;
    }

    // Check context to ensure we're in text content
    const contextValidation = isSelectionInTextContent(model, selection);
    if (!contextValidation.valid) {
      setErrorMessage(contextValidation.reason || 'Invalid selection context');
      return;
    }

    setHighlightMenuAnchor(event.currentTarget);
  };

  const handleHighlightClose = () => {
    setHighlightMenuAnchor(null);
  };

  const applyHighlight = (className: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    if (!selection || selection.isEmpty()) return;

    const model = editor.getModel();
    if (!model) return;

    const selectedText = model.getValueInRange(selection);

    // Final validation before applying
    const validation = isValidTextSelection(selectedText);
    const contextValidation = isSelectionInTextContent(model, selection);

    if (!validation.valid || !contextValidation.valid) {
      setErrorMessage(
        validation.reason ||
          contextValidation.reason ||
          'Cannot highlight this selection',
      );
      handleHighlightClose();
      return;
    }

    // Wrap the selected text with a span tag
    const highlightedText = `<span class="${className}">${selectedText}</span>`;

    // Replace the selected text
    editor.executeEdits('highlight', [
      {
        range: selection,
        text: highlightedText,
      },
    ]);

    // Update the cursor position after the inserted text
    const newPosition = {
      lineNumber: selection.endLineNumber,
      column:
        selection.endColumn + highlightedText.length - selectedText.length,
    };
    editor.setPosition(newPosition);
    editor.focus();

    handleHighlightClose();
  };

  const handleCloseError = () => {
    setErrorMessage('');
  };

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
    <Stack direction="row" spacing={0.5} alignItems="center">
      <IconButton size="small" onClick={undo} title={t('undo')}>
        <UndoIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={redo} title={t('redo')}>
        <RedoIcon fontSize="small" />
      </IconButton>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <IconButton size="small" onClick={search} title={t('search')}>
        <SearchIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={replace} title={t('replace')}>
        <FindReplaceIcon fontSize="small" />
      </IconButton>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <IconButton size="small" onClick={format} title={t('formatCode')}>
        <AutoFixHighIcon fontSize="small" />
      </IconButton>
      {isHtmlFile && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <IconButton
            size="small"
            onClick={handleHighlightClick}
            title={t('highlightText') || 'Highlight Text'}
          >
            <HighlightIcon fontSize="small" />
          </IconButton>
        </>
      )}
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <IconButton size="small" onClick={zoomOut} title={t('zoomOut')}>
        <ZoomOutIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={zoomIn} title={t('zoomIn')}>
        <ZoomInIcon fontSize="small" />
      </IconButton>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <IconButton
        size="small"
        onClick={handleSave}
        title={isDirty ? t('saveUnsaved') : t('save')}
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
          title={t('unsavedChanges')}
        />
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
        fontSize: fontSize,
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
      }}
    >
      {monacoEditor}
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
              {title || t('editorTitle')}
            </Typography>
            <Controls />
            <IconButton
              onClick={toggleFullscreen}
              title={
                document.fullscreenElement
                  ? t('exitFullscreen')
                  : t('fullscreen')
              }
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
                  {`${title || t('editorTitle')} (${t('fullscreen')})`}
                </Typography>
                <Controls />
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={exitDialog}
                  title={t('exitFullscreen')}
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

      {/* Highlight Color Menu */}
      <Menu
        anchorEl={highlightMenuAnchor}
        open={Boolean(highlightMenuAnchor)}
        onClose={handleHighlightClose}
      >
        {highlightColors.map((colorOption) => (
          <MenuItem
            key={colorOption.className}
            onClick={() => applyHighlight(colorOption.className)}
          >
            <ListItemIcon>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  bgcolor: colorOption.color,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                }}
              />
            </ListItemIcon>
            <ListItemText>{colorOption.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseError}
          severity="warning"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
