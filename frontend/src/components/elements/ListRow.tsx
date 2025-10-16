import { ListItem, ListItemButton, ListItemText } from "@mui/material";

interface ListRowProps {
  content: string;
  index: string;
  action: (projectName: string) => void;
}

export const ListRow = ({ content, index, action }: ListRowProps) => {
  return (
    <ListItem key={index} component="div" disablePadding>
      <ListItemButton onClick={() => action(content)}>
        <ListItemText primary={content}/>
      </ListItemButton>
    </ListItem>
  );
};
