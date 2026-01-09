import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Dialog, GlobalStyles } from '@mui/material';
import Editor from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { useTranslation } from 'react-i18next';
import { EditorToolbar } from './AdvancedTextEditor/AdvancedTextEditorToolbar.tsx';
import { FloatingColorPicker } from './AdvancedTextEditor/AdvancedTextEditorFloatingColorPicker.tsx';
import { HighlightMenu } from './AdvancedTextEditor/AdvancedTextEditorHighlightMenu.tsx';

interface HighlightColor {
  name: string;
  className: string;
  color: string;
}

interface IAdvancedTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  title?: string;
  fullscreenMode?: 'dialog' | 'browser';
  onSave: (value: string) => Promise<void>;
  highlightColors?: HighlightColor[];
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

  const [localValue, setLocalValue] = useState(value);
  const [lastSavedValue, setLastSavedValue] = useState(value);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [highlightMenuAnchor, setHighlightMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const { t } = useTranslation();
  const isHtmlFile = language.toLowerCase() === 'html';

  const isValidTextSelection = useCallback((selectedText: string) => {
    if (!selectedText || selectedText.trim().length === 0)
      return { valid: false, reason: 'No text selected' };
    if (selectedText.includes('<') || selectedText.includes('>'))
      return {
        valid: false,
        reason: 'Selection contains HTML tags. Please select only text content.',
      };
    if (/\s*=\s*["']/.test(selectedText))
      return { valid: false, reason: 'Selection appears to contain HTML attributes.' };
    if (
      selectedText.trim().startsWith('<span') &&
      selectedText.trim().endsWith('</span>')
    )
      return { valid: false, reason: 'Text is already highlighted.' };
    return { valid: true };
  }, []);

  const isSelectionInTextContent = useCallback(
    (model: monaco.editor.ITextModel, selection: monaco.Selection) => {
      const beforeSelection = model.getValueInRange({
        startLineNumber: selection.startLineNumber,
        startColumn: 1,
        endLineNumber: selection.startLineNumber,
        endColumn: selection.startColumn,
      });
      const openTagsBefore = (beforeSelection.match(/</g) || []).length;
      const closeTagsBefore = (beforeSelection.match(/>/g) || []).length;
      if (openTagsBefore > closeTagsBefore)
        return {
          valid: false,
          reason: 'Selection is inside an HTML tag. Please select text content only.',
        };

      const lastOpenTag = beforeSelection.lastIndexOf('<');
      const lastCloseTag = beforeSelection.lastIndexOf('>');
      if (lastOpenTag > lastCloseTag) {
        const tagContent = beforeSelection.substring(lastOpenTag);
        if (tagContent.includes('='))
          return { valid: false, reason: 'Selection is in an HTML attribute.' };
        return { valid: false, reason: 'Selection is inside an HTML tag.' };
      }

      const selectedText = model.getValueInRange(selection);
      if (selectedText.includes('<') || selectedText.includes('>'))
        return { valid: false, reason: 'Selection spans across HTML tags.' };
      return { valid: true };
    },
    [],
  );

  const updateColorPickerPosition = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !isHtmlFile) return;
    const selection = editor.getSelection();
    if (!selection || selection.isEmpty()) return setShowColorPicker(false);

    const model = editor.getModel();
    if (!model) return;
    const selectedText = model.getValueInRange(selection);

    const textValidation = isValidTextSelection(selectedText);
    const contextValidation = isSelectionInTextContent(model, selection);
    if (!textValidation.valid || !contextValidation.valid)
      return setShowColorPicker(false);

    const domNode = editor.getDomNode();
    if (!domNode) return;
    const position = editor.getScrolledVisiblePosition(selection.getStartPosition());
    if (!position) return;

    const editorRect = domNode.getBoundingClientRect();
    setColorPickerPosition({
      top: editorRect.top + position.top + window.scrollY - 60,
      left: editorRect.left + position.left + window.scrollX,
    });
    setShowColorPicker(true);
  }, [isHtmlFile, isSelectionInTextContent, isValidTextSelection]);

  const handleSelectionChange = useCallback(() => {
    if (!isHtmlFile) return;
    if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
    selectionTimeoutRef.current = setTimeout(updateColorPickerPosition, 300);
  }, [isHtmlFile, updateColorPickerPosition]);

  useEffect(
    () => () => {
      if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
    },
    [],
  );

  const undo = () => editorRef.current?.trigger('toolbar', 'undo', null);
  const redo = () => editorRef.current?.trigger('toolbar', 'redo', null);
  const search = () => editorRef.current?.getAction('actions.find')?.run();
  const replace = () =>
    editorRef.current?.getAction('editor.action.startFindReplaceAction')?.run();
  const format = () =>
    editorRef.current?.getAction('editor.action.formatDocument')?.run();

  const zoomIn = () =>
    setFontSize((prev) => {
      const next = Math.min(prev + 1, 32);
      editorRef.current?.updateOptions({ fontSize: next });
      return next;
    });

  const zoomOut = () =>
    setFontSize((prev) => {
      const next = Math.max(prev - 1, 6);
      editorRef.current?.updateOptions({ fontSize: next });
      return next;
    });

  const updateValue = (next: string) => {
    setLocalValue(next);
    onChange(next);
    setIsDirty(next !== lastSavedValue);
  };

  const handleEditorChange = (v?: string) => updateValue(v ?? '');

  const handleSave = async () => {
    const current = localValue;
    await onSave(current);
    setLastSavedValue(current);
    setIsDirty(false);
  };

  const toggleFullscreen = async () => {
    if (fullscreenMode === 'dialog') return setDialogOpen((v) => !v);
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen();
  };

  const exitDialog = () => setDialogOpen(false);

  const removeHighlights = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;
    const newValue = model
      .getValue()
      .replace(/<span class="mmu-highlight-\w+">([^<]*)<\/span>/g, '$1');
    model.setValue(newValue);
    updateValue(newValue);
  };

  const handleHighlightClick = (event: React.MouseEvent<HTMLElement>) => {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = editor.getSelection();
    if (!selection || selection.isEmpty())
      return setErrorMessage('Please select some text first');

    const model = editor.getModel();
    if (!model) return;
    const selectedText = model.getValueInRange(selection);

    const textValidation = isValidTextSelection(selectedText);
    if (!textValidation.valid)
      return setErrorMessage(textValidation.reason || 'Invalid selection');

    const contextValidation = isSelectionInTextContent(model, selection);
    if (!contextValidation.valid)
      return setErrorMessage(contextValidation.reason || 'Invalid selection context');

    setHighlightMenuAnchor(event.currentTarget);
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
      setHighlightMenuAnchor(null);
      setShowColorPicker(false);
      return;
    }

    const highlightedText = `<span class="${className}">${selectedText}</span>`;
    editor.executeEdits('highlight', [{ range: selection, text: highlightedText }]);
    editor.setPosition({
      lineNumber: selection.endLineNumber,
      column: selection.endColumn + highlightedText.length - selectedText.length,
    });
    editor.focus();
    setHighlightMenuAnchor(null);
    setShowColorPicker(false);
  };

  const handleCloseError = () => setErrorMessage('');

  const fullscreenIcon = useMemo(() => {
    if (fullscreenMode === 'dialog') return dialogOpen ? 'exit' : 'enter';
    return document.fullscreenElement ? 'exit' : 'enter';
  }, [fullscreenMode, dialogOpen]);

  const hideOuterToolbar = fullscreenMode === 'dialog' && dialogOpen;

  const monacoEditor = (
    <Editor
      value={localValue}
      language={language}
      onChange={handleEditorChange}
      onMount={(editor) => {
        editorRef.current = editor;
        editor.updateOptions({ fontSize });
        editor.onDidChangeCursorSelection(handleSelectionChange);
        editor.onDidBlurEditorText(() => setTimeout(() => setShowColorPicker(false), 200));
      }}
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
        fontSize,
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
        <EditorToolbar
          title={title || t('editorTitle')}
          t={t}
          isDirty={isDirty}
          fullscreenIcon={fullscreenIcon}
          onUndo={undo}
          onRedo={redo}
          onSearch={search}
          onReplace={replace}
          onFormat={format}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onSave={handleSave}
          onToggleFullscreen={toggleFullscreen}
          onHighlightClick={isHtmlFile ? handleHighlightClick : undefined}
          onRemoveHighlights={isHtmlFile ? removeHighlights : undefined}
        />
      )}

      {fullscreenMode === 'dialog' ? (
        <>
          {!dialogOpen && editor}
          <Dialog
            fullScreen
            open={dialogOpen}
            onClose={exitDialog}
            slotProps={{
              paper: { sx: { display: 'flex', flexDirection: 'column', height: '100vh' } },
            }}
          >
            <EditorToolbar
              title={`${title || t('editorTitle')} (${t('fullscreen')})`}
              t={t}
              isDirty={isDirty}
              fullscreenIcon="exit"
              onUndo={undo}
              onRedo={redo}
              onSearch={search}
              onReplace={replace}
              onFormat={format}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onSave={handleSave}
              onToggleFullscreen={exitDialog}
              onHighlightClick={isHtmlFile ? handleHighlightClick : undefined}
              onRemoveHighlights={isHtmlFile ? removeHighlights : undefined}
              color="primary"
              dense
            />
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>{editor}</Box>
          </Dialog>
        </>
      ) : (
        editor
      )}

      {showColorPicker && colorPickerPosition && isHtmlFile && (
        <FloatingColorPicker
          position={colorPickerPosition}
          highlightColors={highlightColors}
          onSelect={applyHighlight}
          onRequestClose={() => setShowColorPicker(false)}
        />
      )}

      <HighlightMenu
        anchorEl={highlightMenuAnchor}
        open={Boolean(highlightMenuAnchor)}
        highlightColors={highlightColors}
        onClose={() => setHighlightMenuAnchor(null)}
        onSelect={applyHighlight}
        errorMessage={errorMessage}
        onErrorClose={handleCloseError}
      />
    </Box>
  );
};
