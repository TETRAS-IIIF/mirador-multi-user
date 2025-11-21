import { ListItem, Tooltip } from '@mui/material';
import { ItemButton } from '../../SideBar/ItemButton';
import UpdateIcon from '@mui/icons-material/Update';
import { useTranslation } from 'react-i18next';
import { Project } from '../../../../features/projects/types/types.ts';

interface IDrawerGenerateSnapshotProps {
  open: boolean;
  projectSelected: Project;
  handleGenerateSnapshot: (projectId: number) => void;
}

export function DrawerGenerateSnapshot({
  open,
  projectSelected,
  handleGenerateSnapshot,
}: IDrawerGenerateSnapshotProps) {
  const { t } = useTranslation();

  return (
    <>
      <Tooltip title={t('generate_snapshot_tooltip')} placement="left">
        <ListItem sx={{ padding: 0 }}>
          <ItemButton
            icon={<UpdateIcon />}
            text={t('generate_snapshot')}
            open={open}
            selected={false}
            action={() => handleGenerateSnapshot(projectSelected.id)}
          />
        </ListItem>
      </Tooltip>
    </>
  );
}
