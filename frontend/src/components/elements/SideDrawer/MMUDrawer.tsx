import { DrawerHeader } from './Drawer/DrawerHeader';
import {
  CSSObject,
  Divider,
  List,
  ListItem,
  styled,
  Theme,
  Tooltip,
} from '@mui/material';
import { DrawerElementContentMenu } from './Drawer/DrawerElementContentMenu';
import { DrawerElementSaveProject } from './Drawer/DrawerElementSaveProject';
import { DrawerElementAdmin } from './Drawer/DrawerElementAdmin';
import { ItemButton } from '../SideBar/ItemButton';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import MuiDrawer from '@mui/material/Drawer';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DrawerGenerateSnapshot } from './Drawer/DrawerGenerateSnapshot.tsx';
import { Project } from '../../../features/projects/types/types.ts';
import { User } from '../../../features/auth/types/types.ts';
import { MENU_ELEMENT } from '../../../utils/utils.ts';

const drawerWidth = 240;
const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const StyledDrawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}));

interface MMUDrawerProps {
  handleChangeContent: (content: string) => void;
  setShowSignOutModal: (show: boolean) => void;
  projectSelected: Project | null;
  saveProject: () => void;
  selectedContent: string;
  user: User;
  handleGenerateSnapshot: (projectId: number) => void;
}

export function MMUDrawer({
  handleChangeContent,
  setShowSignOutModal,
  projectSelected,
  saveProject,
  selectedContent,
  user,
  handleGenerateSnapshot,
}: MMUDrawerProps) {
  const [isSideDrawerExpanded, setIsSideDrawerExpanded] = useState(true);

  const { t } = useTranslation();

  const handleDrawerClose = () => {
    setIsSideDrawerExpanded(false);
  };

  const handleDrawerOpen = () => {
    setIsSideDrawerExpanded(true);
  };

  return (
    <StyledDrawer variant="permanent" open={isSideDrawerExpanded}>
      <DrawerHeader
        isSideDrawerExpanded={isSideDrawerExpanded}
        handleDrawerClose={handleDrawerClose}
        handleDrawerOpen={handleDrawerOpen}
      />
      <Divider />
      <DrawerElementContentMenu
        open={isSideDrawerExpanded}
        selectedContent={selectedContent}
        handleChangeContent={handleChangeContent}
      />
      <Divider sx={{ mb: 0 }} />
      {projectSelected && (
        <>
          <DrawerElementSaveProject
            open={isSideDrawerExpanded}
            projectSelected={projectSelected}
            saveProject={saveProject}
          />
          <Divider />
          <DrawerGenerateSnapshot
            open={isSideDrawerExpanded}
            projectSelected={projectSelected}
            handleGenerateSnapshot={handleGenerateSnapshot}
          />
          <Divider />
        </>
      )}
      <List>
        {user._isAdmin && (
          <DrawerElementAdmin
            title={t('titleAdmin')}
            open={isSideDrawerExpanded}
            text={t('admin')}
            action={() => handleChangeContent(MENU_ELEMENT.ADMIN)}
          />
        )}
        <Tooltip title={t('titleSettings')} placement="right">
          <ListItem sx={{ padding: 0 }}>
            <ItemButton
              open={isSideDrawerExpanded}
              selected={false}
              icon={<SettingsIcon />}
              text={t('settings')}
              action={() => handleChangeContent(MENU_ELEMENT.SETTING)}
            />
          </ListItem>
        </Tooltip>
        <Tooltip title={t('titleDisconnect')} placement="right">
          <ListItem sx={{ padding: 0 }}>
            <ItemButton
              open={isSideDrawerExpanded}
              selected={false}
              icon={<LogoutIcon />}
              text={t('disconnect')}
              action={() => setShowSignOutModal(true)}
            />
          </ListItem>
        </Tooltip>
      </List>
    </StyledDrawer>
  );
}
