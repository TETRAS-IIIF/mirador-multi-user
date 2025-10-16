import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { ReactNode } from "react";

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
    <ListItem
      key={text}
      disablePadding
      sx={{
        display: "block",
        backgroundColor: selected ? "#dcdcdc" : "inherit",
      }}>
      <ListItemButton
        sx={{
          minHeight: 48,
          justifyContent: open ? "initial" : "center",
          px: 2.5,
        }}
        onClick={action}>
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 3 : "auto",
            justifyContent: "center",
          }}>
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={text}
          sx={{
            opacity: open ? 1 : 0,
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}/>
      </ListItemButton>
    </ListItem>
  );
};
