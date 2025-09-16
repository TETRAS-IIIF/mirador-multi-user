import * as React from 'react';
import { JsonEditor } from 'json-edit-react';
import useUndo from 'use-undo';
import { AppBar, Box, Button, Dialog, IconButton, Toolbar, Typography, } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'; // collapse all
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'; // expand all
import SortIcon from '@mui/icons-material/Sort';

type JSONPrimitive = string | number | boolean | null;
export type JSONValue =
  | JSONPrimitive
  | { [k: string]: JSONValue }
  | JSONValue[];

function sortKeysDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => sortKeysDeep(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sorted = Object.keys(obj)
      .sort((a, b) => a.localeCompare(b))
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeysDeep(obj[key]);
        return acc;
      }, {});
    return sorted as unknown as T;
  }
  return value;
}

type Props = {
  initialData: object;
  startCollapsed?: boolean;
  fullscreenMode?: 'dialog' | 'browser';
  title?: string;
  onUpdate?: (data: { newData: any }) => Promise<void> | void;
};

export default function JsonEditorWithControls({
  initialData,
  startCollapsed = true,
  fullscreenMode = 'dialog',
  title = 'JSON editor',
  onUpdate,
}: Props) {
  const [{ present: data }, { set: setData, undo, redo, canUndo, canRedo }] =
    useUndo<JSONValue>(sortKeysDeep(initialData as JSONValue));

  const [allCollapsed, setAllCollapsed] =
    React.useState<boolean>(startCollapsed);

  type JsonEditorProps = React.ComponentProps<typeof JsonEditor>;
  const externalTriggers = React.useMemo<JsonEditorProps['externalTriggers']>(
    () => ({
      collapse: [{ path: [], collapsed: allCollapsed, includeChildren: true }],
    }),
    [allCollapsed],
  );

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const toggleFullscreen = async () => {
    if (fullscreenMode === 'dialog') {
      setDialogOpen((v) => !v);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) await el.requestFullscreen();
    else await document.exitFullscreen();
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      } else if (key === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, canUndo, canRedo]);

  const sortCurrent = async () => {
    const sorted = sortKeysDeep(data) as JSONValue;
    setData(sorted);
    await onUpdate?.({ newData: sorted });
  };
  const expandAll = () => setAllCollapsed(false);
  const collapseAll = () => setAllCollapsed(true);
  const exitDialog = () => setDialogOpen(false);

  const handleSetData = React.useCallback(
    async (next: unknown) => {
      const nextJson = next as JSONValue;
      setData(nextJson);
      await onUpdate?.({ newData: nextJson });
    },
    [setData, onUpdate],
  );

  const editor = (
    <Box sx={{ height: '100%', overflow: 'auto', p: 1 }}>
      <JsonEditor
        data={data}
        setData={handleSetData}
        externalTriggers={externalTriggers}
      />
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
      }}
    >
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <Typography variant="subtitle2" sx={{ flex: 1 }}>
            {title}
          </Typography>

          <Button startIcon={<SortIcon />} onClick={sortCurrent}>
            Sort keys
          </Button>

          <IconButton
            onClick={collapseAll}
            title="Collapse all"
            aria-label="Collapse all"
          >
            <UnfoldLessIcon />
          </IconButton>
          <IconButton
            onClick={expandAll}
            title="Expand all"
            aria-label="Expand all"
          >
            <UnfoldMoreIcon />
          </IconButton>

          <IconButton
            onClick={() => canUndo && undo()}
            disabled={!canUndo}
            title="Undo"
          >
            <UndoIcon />
          </IconButton>
          <IconButton
            onClick={() => canRedo && redo()}
            disabled={!canRedo}
            title="Redo"
          >
            <RedoIcon />
          </IconButton>

          <IconButton onClick={toggleFullscreen} title="Fullscreen">
            {fullscreenMode === 'dialog' ? (
              dialogOpen ? (
                <FullscreenExitIcon />
              ) : (
                <FullscreenIcon />
              )
            ) : document.fullscreenElement ? (
              <FullscreenExitIcon />
            ) : (
              <FullscreenIcon />
            )}
          </IconButton>
        </Toolbar>
      </AppBar>

      {fullscreenMode === 'dialog' ? (
        <>
          {!dialogOpen && editor}
          <Dialog fullScreen open={dialogOpen} onClose={exitDialog}>
            <AppBar sx={{ position: 'sticky' }}>
              <Toolbar>
                <Typography sx={{ flex: 1 }} variant="h6">
                  {title} (Fullscreen)
                </Typography>
                <IconButton edge="end" color="inherit" onClick={exitDialog}>
                  <FullscreenExitIcon />
                </IconButton>
              </Toolbar>
            </AppBar>
            {editor}
          </Dialog>
        </>
      ) : (
        editor
      )}
    </Box>
  );
}
