import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { ReactNode } from 'react';

interface IItemButton {
  open: boolean;
  action: () => void;
  icon: ReactNode;
  text: string;
  selected: boolean;
}

export const ItemButton = ({
  open,
  action,
  icon,
  text,
  selected,
}: IItemButton) => {
  return (
    <ListItemButton
      onClick={action}
      selected={selected}
      sx={{
        minHeight: 48,
        justifyContent: open ? 'initial' : 'center',
        px: 2.5,
        // optional: preserve your selected background
        ...(selected && { backgroundColor: '#dcdcdc' }),
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 0,
          mr: open ? 3 : 'auto',
          justifyContent: 'center',
        }}
      >
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={text}
        sx={{
          opacity: open ? 1 : 0,
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      />
    </ListItemButton>
  );
};
