import * as React from 'react';
import { JsonEditor } from 'json-edit-react';
import useUndo from 'use-undo';
import {
  AppBar,
  Box,
  Button,
  Dialog,
  GlobalStyles,
  IconButton,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import SortIcon from '@mui/icons-material/Sort';
import SearchIcon from '@mui/icons-material/Search';

type JSONPrimitive = string | number | boolean | null;
export type JSONValue =
  | JSONPrimitive
  | { [k: string]: JSONValue }
  | JSONValue[];

function sortKeysDeep<T>(value: T): T {
  if (Array.isArray(value))
    return value.map((v) => sortKeysDeep(v)) as unknown as T;
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
  const [searchTerm, setSearchTerm] = React.useState('');

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

  const filterJson = (input: JSONValue): JSONValue => {
    if (!searchTerm.trim()) return input;
    const term = searchTerm.toLowerCase();

    if (Array.isArray(input)) {
      const filtered = input
        .map((v) => filterJson(v))
        .filter((v) => v !== null && v !== undefined);
      return filtered as JSONValue;
    }

    if (input && typeof input === 'object') {
      const entries = Object.entries(input).filter(([k, v]) => {
        if (k.toLowerCase().includes(term)) return true;
        if (typeof v === 'string' && v.toLowerCase().includes(term))
          return true;
        const nested = filterJson(v as JSONValue);
        return (
          nested && typeof nested === 'object' && Object.keys(nested).length > 0
        );
      });
      const obj = Object.fromEntries(
        entries.map(([k, v]) => [k, filterJson(v as JSONValue)]),
      );
      return obj as JSONValue;
    }

    if (
      typeof input === 'string' ||
      typeof input === 'number' ||
      typeof input === 'boolean'
    ) {
      return String(input).toLowerCase().includes(term)
        ? input
        : ({} as JSONValue);
    }

    return {} as JSONValue;
  };

  const visibleData = React.useMemo<JSONValue>(
    () => filterJson(data),
    [data, searchTerm],
  );

  const editor = (
    <Box
      sx={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        width: '100%',
        overflow: 'auto',
        p: 1,
        display: 'flex',
        '& .jer-container': {
          maxWidth: 'none !important',
          width: '100% !important',
        },
        '& .json-edit-react': {
          width: '100%',
          height: '100%',
        },
      }}
    >
      <JsonEditor
        data={visibleData}
        setData={handleSetData}
        externalTriggers={externalTriggers}
        maxWidth="none"
        minWidth={0}
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
        height: '100%',
        width: '100%',
        '&:fullscreen': { width: '100vw', height: '100vh' },
      }}
    >
      <GlobalStyles
        styles={{
          '.jer-container': {
            maxWidth: 'none !important',
            width: '100% !important',
            height: '100% !important',
          },
          '.json-edit-react': { width: '100%', height: '100%' },
        }}
      />

      <AppBar position="static" color="default" elevation={0}>
        <Toolbar variant="dense" sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" sx={{ flex: 1, minWidth: 120 }}>
            {title}
          </Typography>

          <TextField
            size="small"
            placeholder="Search..."
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5 }} />,
            }}
            sx={{ width: 200 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Button startIcon={<SortIcon />} onClick={sortCurrent}>
            Sort keys
          </Button>

          <IconButton onClick={collapseAll} title="Collapse all">
            <UnfoldLessIcon />
          </IconButton>
          <IconButton onClick={expandAll} title="Expand all">
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
          <Dialog
            fullScreen
            open={dialogOpen}
            onClose={exitDialog}
            PaperProps={{
              sx: {
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
              },
            }}
          >
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
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>{editor}</Box>
          </Dialog>
        </>
      ) : (
        editor
      )}
    </Box>
  );
}
