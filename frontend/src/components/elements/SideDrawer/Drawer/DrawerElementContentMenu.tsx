import { List, ListItem, Tooltip } from "@mui/material";
import { ItemButton } from "../../SideBar/ItemButton";
import WorkIcon from "@mui/icons-material/Work";
import ArticleIcon from "@mui/icons-material/Article";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import GroupsIcon from "@mui/icons-material/Groups";
import { useTranslation } from "react-i18next";
import { MENU_ELEMENT } from "../../../../utils/utils.ts";

interface DrawerElementContentMenuProps {
  open: boolean;
  selectedContent: string;
  handleChangeContent: (content: string) => void;
}

export function DrawerElementContentMenu({
  open,
  selectedContent,
  handleChangeContent,
}: DrawerElementContentMenuProps) {
  const { t } = useTranslation();

  return (
    <List sx={{ minHeight: "50vh", flexGrow: 1, padding: 0 }}>
      <Tooltip title={t("projectTitle")} placement="right">
        <ListItem sx={{ padding: 0, margin: 0 }}>
          <ItemButton
            selected={MENU_ELEMENT.PROJECTS === selectedContent}
            open={open}
            icon={<WorkIcon />}
            text={t("project")}
            action={() => handleChangeContent(MENU_ELEMENT.PROJECTS)}
          />
        </ListItem>
      </Tooltip>
      <Tooltip title={t("myManifests")} placement="right">
        <ListItem sx={{ padding: 0 }}>
          <ItemButton
            open={open}
            selected={MENU_ELEMENT.MANIFEST === selectedContent}
            icon={<ArticleIcon />}
            text={t("manifests")}
            action={() => handleChangeContent(MENU_ELEMENT.MANIFEST)}
          />
        </ListItem>
      </Tooltip>
      <Tooltip title={t("mediaTitle")} placement="right">
        <ListItem sx={{ padding: 0 }}>
          <ItemButton
            open={open}
            selected={MENU_ELEMENT.MEDIA === selectedContent}
            icon={<PermMediaIcon />}
            text={t("media")}
            action={() => handleChangeContent(MENU_ELEMENT.MEDIA)}
          />
        </ListItem>
      </Tooltip>
      <Tooltip title={t("groupTitle")} placement="right">
        <ListItem sx={{ padding: 0 }}>
          <ItemButton
            open={open}
            selected={MENU_ELEMENT.GROUPS === selectedContent}
            icon={<GroupsIcon />}
            text={t("group")}
            action={() => handleChangeContent(MENU_ELEMENT.GROUPS)}
          />
        </ListItem>
      </Tooltip>
    </List>
  );
}
