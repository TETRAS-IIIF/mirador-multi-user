import {
  Alert,
  Box,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
} from '@mui/material';

type HighlightMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  highlightColors: Array<{ name: string; className: string; color: string }>;
  onClose: () => void;
  onSelect: (className: string) => void;
  errorMessage: string;
  onErrorClose: () => void;
};

export const HighlightMenu = ({
                                anchorEl,
                                open,
                                highlightColors,
                                onClose,
                                onSelect,
                                errorMessage,
                                onErrorClose,
                              }: HighlightMenuProps) => (
  <>
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      {highlightColors.map((colorOption) => (
        <MenuItem key={colorOption.className} onClick={() => onSelect(colorOption.className)}>
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
    <Snackbar
      open={!!errorMessage}
      autoHideDuration={4000}
      onClose={onErrorClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onErrorClose} severity="warning" sx={{ width: '100%' }}>
        {errorMessage}
      </Alert>
    </Snackbar>
  </>
);
