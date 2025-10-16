import { ListItem, Tooltip } from "@mui/material";
import { ItemButton } from "../../SideBar/ItemButton";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

interface DrawerElementAdminProps {
  open: boolean;
  text: string;
  title: string;
  action: () => void;
}

export function DrawerElementAdmin({
  open,
  text,
  title,
  action,
}: DrawerElementAdminProps) {
  return (
    <Tooltip title={title} placement="right">
      <ListItem sx={{ padding: 0 }}>
        <ItemButton
          open={open}
          selected={false}
          icon={<AdminPanelSettingsIcon/>}
          text={text}
          action={action}/>
      </ListItem>
    </Tooltip>
  );
}
