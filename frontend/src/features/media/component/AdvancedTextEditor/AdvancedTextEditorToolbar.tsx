import {
  AppBar,
  Box,
  Divider,
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
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import SaveIcon from '@mui/icons-material/Save';
import HighlightIcon from '@mui/icons-material/Highlight';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PublicIcon from '@mui/icons-material/Public';

type ToolbarProps = {
  title: string;
  t: (key: string) => string;
  isDirty: boolean;
  fullscreenIcon: 'enter' | 'exit';
  onUndo: () => void;
  onRedo: () => void;
  onSearch: () => void;
  onReplace: () => void;
  onFormat: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSave: () => void;
  onToggleFullscreen: () => void;
  onHighlightClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onRemoveHighlights?: () => void;
  isHtmlFile: boolean;
  onOpenW3CValidator: () => void;
  color?: 'default' | 'primary';
  dense?: boolean;
};

export const EditorToolbar = ({
  title,
  t,
  isDirty,
  fullscreenIcon,
  onUndo,
  onRedo,
  onSearch,
  onReplace,
  onFormat,
  onZoomIn,
  onZoomOut,
  onSave,
  onToggleFullscreen,
  onHighlightClick,
  onRemoveHighlights,
  isHtmlFile,
  onOpenW3CValidator,
  color = 'default',
  dense = false,
}: ToolbarProps) => (
  <AppBar position="static" color={color} elevation={0}>
    <Toolbar variant={dense ? 'dense' : 'regular'} sx={{ gap: 1 }}>
      <Typography variant={dense ? 'subtitle2' : 'h6'} sx={{ flex: 1, minWidth: 120 }}>
        {title}
      </Typography>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <IconButton size="small" onClick={onUndo} title={t('undo')}>
          <UndoIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onRedo} title={t('redo')}>
          <RedoIcon fontSize="small" />
        </IconButton>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <IconButton size="small" onClick={onSearch} title={t('search')}>
          <SearchIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onReplace} title={t('replace')}>
          <FindReplaceIcon fontSize="small" />
        </IconButton>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <IconButton size="small" onClick={onFormat} title={t('formatCode')}>
          <AutoFixHighIcon fontSize="small" />
        </IconButton>
        {onHighlightClick && onRemoveHighlights && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <IconButton
              size="small"
              onClick={onHighlightClick}
              title={t('advancedEditor.highlightText')}
            >
              <HighlightIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={onRemoveHighlights} title={t('advancedEditor.removeAllHighlights')}>
              <HighlightOffIcon sx={{ textDecoration: 'line-through' }} />
            </IconButton>
          </>
        )}
        {isHtmlFile && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <IconButton
              title={t('advancedEditor.validateWithW3C')}
              onClick={onOpenW3CValidator}
              color="primary">
              <PublicIcon />
            </IconButton>
          </>)
        }
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <IconButton size="small" onClick={onZoomOut} title={t('zoomOut')}>
          <ZoomOutIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onZoomIn} title={t('zoomIn')}>
          <ZoomInIcon fontSize="small" />
        </IconButton>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <IconButton
          size="small"
          onClick={onSave}
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
      <IconButton
        onClick={onToggleFullscreen}
        title={fullscreenIcon === 'exit' ? t('exitFullscreen') : t('fullscreen')}
        sx={{ ml: 1 }}
      >
        {fullscreenIcon === 'exit' ? <FullscreenExitIcon /> : <FullscreenIcon />}
      </IconButton>
    </Toolbar>
  </AppBar>
);


