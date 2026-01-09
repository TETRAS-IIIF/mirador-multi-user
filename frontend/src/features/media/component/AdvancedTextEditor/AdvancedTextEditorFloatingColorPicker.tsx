import { IconButton, Paper, Tooltip } from '@mui/material';
import HighlightIcon from '@mui/icons-material/Highlight';

type FloatingColorPickerProps = {
  position: { top: number; left: number };
  highlightColors: Array<{ name: string; className: string; color: string }>;
  onSelect: (className: string) => void;
  onRequestClose?: () => void;
};

export const FloatingColorPicker = ({
                                      position,
                                      highlightColors,
                                      onSelect,
                                      onRequestClose,
                                    }: FloatingColorPickerProps) => (
  <Paper
    elevation={8}
    sx={{
      position: 'fixed',
      top: position.top,
      left: position.left,
      zIndex: 1300,
      p: 1,
      display: 'flex',
      gap: 0.5,
      borderRadius: 2,
    }}
    onMouseDown={(e) => {
      e.preventDefault();
      onRequestClose?.();
    }}
  >
    {highlightColors.map((colorOption) => (
      <Tooltip key={colorOption.className} title={colorOption.name}>
        <IconButton
          size="small"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(colorOption.className);
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
);
