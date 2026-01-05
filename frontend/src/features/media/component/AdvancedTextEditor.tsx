import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
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
  Paper,
  Snackbar,
  Stack,
  Toolbar,
  Tooltip,
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
    { name: 'Yellow', className: 'mmu-highlight-yellow', color: '#ffeb3b' },
    { name: 'Green', className: 'mmu-highlight-green', color: '#4caf50' },
    { name: 'Blue', className: 'mmu-highlight-blue', color: '#2196f3' },
    { name: 'Red', className: 'mmu-highlight-red', color: 'red' },
    { name: 'Orange', className: 'mmu-highlight-orange', color: '#ff9800' },
  ],
}: IAdvancedTextEditorProps) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [localValue, setLocalValue] = useState<string>(value);
  const [lastSavedValue, setLastSavedValue] = useState<string>(value);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [highlightMenuAnchor, setHighlightMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // New states for hover popup
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const { t } = useTranslation();

  const isHtmlFile = language.toLowerCase() === 'html';

  // Add this function inside your component
  const removeHighlights = () => {
    if (!editorRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    // Remove all highlight classes from the content
    const currentValue = model.getValue();
    const newValue = currentValue.replace(
      /<span class="mmu-highlight-\w+">([^<]*)<\/span>/g,
      '$1',
    );

    // Update the editor content
    model.setValue(newValue);

    // Update the local state
    updateValue(newValue);
  };

  /**
   * Validates if the selected text is pure text content (not HTML tags/attributes)
   */
  const isValidTextSelection = useCallback(
    (selectedText: string): { valid: boolean; reason?: string } => {
      if (!selectedText || selectedText.trim().length === 0) {
        return { valid: false, reason: 'No text selected' };
      }

      if (selectedText.includes('<') || selectedText.includes('>')) {
        return {
          valid: false,
          reason:
            'Selection contains HTML tags. Please select only text content.',
        };
      }

      const attributePattern = /\s*=\s*["']/;
      if (attributePattern.test(selectedText)) {
        return {
          valid: false,
          reason: 'Selection appears to contain HTML attributes.',
        };
      }

      if (
        selectedText.trim().startsWith('<span') &&
        selectedText.trim().endsWith('</span>')
      ) {
        return { valid: false, reason: 'Text is already highlighted.' };
      }

      return { valid: true };
    },
    [],
  );

  /**
   * Gets the full line context to check if selection is within tag content
   */
  const isSelectionInTextContent = useCallback(
    (
      model: monaco.editor.ITextModel,
      selection: monaco.Selection,
    ): { valid: boolean; reason?: string } => {
      const startLine = selection.startLineNumber;

      const beforeSelection = model.getValueInRange({
        startLineNumber: startLine,
        startColumn: 1,
        endLineNumber: selection.startLineNumber,
        endColumn: selection.startColumn,
      });

      const openTagsBefore = (beforeSelection.match(/</g) || []).length;
      const closeTagsBefore = (beforeSelection.match(/>/g) || []).length;

      if (openTagsBefore > closeTagsBefore) {
        return {
          valid: false,
          reason:
            'Selection is inside an HTML tag. Please select text content only.',
        };
      }

      const lastOpenTag = beforeSelection.lastIndexOf('<');
      const lastCloseTag = beforeSelection.lastIndexOf('>');

      if (lastOpenTag > lastCloseTag) {
        const tagContent = beforeSelection.substring(lastOpenTag);
        if (tagContent.includes('=')) {
          return { valid: false, reason: 'Selection is in an HTML attribute.' };
        }
        return { valid: false, reason: 'Selection is inside an HTML tag.' };
      }

      const selectedText = model.getValueInRange(selection);
      if (selectedText.includes('<') || selectedText.includes('>')) {
        return { valid: false, reason: 'Selection spans across HTML tags.' };
      }

      return { valid: true };
    },
    [],
  );

  const updateColorPickerPosition = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !isHtmlFile) return;

    const selection = editor.getSelection();
    if (!selection || selection.isEmpty()) {
      setShowColorPicker(false);
      return;
    }

    const model = editor.getModel();
    if (!model) return;

    const selectedText = model.getValueInRange(selection);

    // Validate the selection
    const textValidation = isValidTextSelection(selectedText);
    const contextValidation = isSelectionInTextContent(model, selection);

    if (!textValidation.valid || !contextValidation.valid) {
      setShowColorPicker(false);
      return;
    }

    // Get the DOM node and calculate position
    const domNode = editor.getDomNode();
    if (!domNode) return;

    // Get the visual position of the start of the selection
    const position = editor.getScrolledVisiblePosition(
      selection.getStartPosition(),
    );

    if (position) {
      const editorRect = domNode.getBoundingClientRect();

      setColorPickerPosition({
        top: editorRect.top + position.top + window.scrollY - 60,
        left: editorRect.left + position.left + window.scrollX,
      });

      setShowColorPicker(true);
    }
  }, [isHtmlFile, isValidTextSelection, isSelectionInTextContent]);

  const handleSelectionChange = useCallback(() => {
    if (!isHtmlFile) return;

    // Clear any existing timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    // Set a new timeout to show color picker after selection
    selectionTimeoutRef.current = setTimeout(() => {
      updateColorPickerPosition();
    }, 300); // Small delay to ensure selection is complete
  }, [isHtmlFile, updateColorPickerPosition]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.updateOptions({ fontSize: fontSize });

    // Listen to selection changes
    editor.onDidChangeCursorSelection(() => {
      handleSelectionChange();
    });

    // Hide color picker when clicking elsewhere
    editor.onDidBlurEditorText(() => {
      setTimeout(() => setShowColorPicker(false), 200);
    });
  };

  useEffect(() => {
    return () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, []);

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

    const textValidation = isValidTextSelection(selectedText);
    if (!textValidation.valid) {
      setErrorMessage(textValidation.reason || 'Invalid selection');
      return;
    }

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

    const validation = isValidTextSelection(selectedText);
    const contextValidation = isSelectionInTextContent(model, selection);

    if (!validation.valid || !contextValidation.valid) {
      setErrorMessage(
        validation.reason ||
          contextValidation.reason ||
          'Cannot highlight this selection',
      );
      handleHighlightClose();
      setShowColorPicker(false);
      return;
    }

    const highlightedText = `<span class="${className}">${selectedText}</span>`;

    editor.executeEdits('highlight', [
      {
        range: selection,
        text: highlightedText,
      },
    ]);

    const newPosition = {
      lineNumber: selection.endLineNumber,
      column:
        selection.endColumn + highlightedText.length - selectedText.length,
    };
    editor.setPosition(newPosition);
    editor.focus();

    handleHighlightClose();
    setShowColorPicker(false);
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
          </IconButton>{' '}
          <IconButton onClick={removeHighlights} title="Remove all highlights">
            <HighlightOffIcon sx={{ textDecoration: 'line-through' }} />
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

      {/* Floating Color Picker */}
      {showColorPicker && colorPickerPosition && isHtmlFile && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            top: colorPickerPosition.top,
            left: colorPickerPosition.left,
            zIndex: 1300,
            p: 1,
            display: 'flex',
            gap: 0.5,
            borderRadius: 2,
          }}
          onMouseDown={(e) => {
            // Prevent editor from losing focus
            e.preventDefault();
          }}
        >
          {highlightColors.map((colorOption) => (
            <Tooltip key={colorOption.className} title={colorOption.name}>
              <IconButton
                size="small"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyHighlight(colorOption.className);
                }}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: colorOption.color,
                  '&:hover': {
                    bgcolor: colorOption.color,
                    opacity: 0.8,
                    transform: 'scale(1.1)',
                  },
                  border: 1,
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                }}
              >
                <HighlightIcon fontSize="small" sx={{ color: 'white' }} />
              </IconButton>
            </Tooltip>
          ))}
        </Paper>
      )}

      {/* Highlight Color Menu (from toolbar button) */}
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
