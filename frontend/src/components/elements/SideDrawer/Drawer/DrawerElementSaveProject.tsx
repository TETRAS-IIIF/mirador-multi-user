import { Divider, List, ListItem, Tooltip } from '@mui/material';
import { ItemButton } from '../../SideBar/ItemButton';
import WorkIcon from '@mui/icons-material/Work';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';

interface DrawerElementSaveProjectProps {
  open: boolean;
  projectSelected: any;
  saveProject: () => void;
}

export function DrawerElementSaveProject({
  open,
  projectSelected,
  saveProject,
}: DrawerElementSaveProjectProps) {
  const { t } = useTranslation();

  return (
    <List sx={{ padding: 0, margin: 0 }}>
      <Tooltip title={projectSelected!.title} placement="left">
        <ListItem sx={{ padding: 0, margin: 0 }}>
          <ItemButton
            icon={<WorkIcon />}
            text={projectSelected!.title}
            open={open}
            selected={false}
            action={() => console.log('')}
          />
        </ListItem>
      </Tooltip>
      <Divider />
      <Tooltip title={t('save')} placement="left">
        <ListItem sx={{ padding: 0 }}>
          <ItemButton
            open={open}
            selected={false}
            icon={<SaveIcon />}
            text={t('saveProject')}
            action={saveProject}
          />
        </ListItem>
      </Tooltip>
    </List>
  );
}
