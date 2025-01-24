import { Box, CSSObject, Divider, Grid, List, ListItem, styled, Theme, Tooltip } from '@mui/material';
import { Dispatch, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MuiDrawer from '@mui/material/Drawer';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { ItemButton } from './SideBar/ItemButton.tsx';
import { AllProjects } from '../../features/projects/components/AllProjects.tsx';
import { AllGroups } from '../../features/user-group/components/AllGroups.tsx';
import { updateProject } from '../../features/projects/api/updateProject.ts';
import { CreateProjectDto, Project } from '../../features/projects/types/types.ts';
import IState from '../../features/mirador/interface/IState.ts';
import { MMUModal } from './modal.tsx';
import { ConfirmDisconnect } from '../../features/auth/components/confirmDisconect.tsx';
import MiradorViewer from '../../features/mirador/Mirador.tsx';
import { getUserAllProjects } from '../../features/projects/api/getUserAllProjects.ts';
import { createProject } from '../../features/projects/api/createProject.ts';
import toast from 'react-hot-toast';
import { AllMedias } from '../../features/media/component/AllMedias.tsx';
import { User } from '../../features/auth/types/types.ts';
import { Media, MediaGroupRights } from '../../features/media/types/types.ts';
import { getUserGroupMedias } from '../../features/media/api/getUserGroupMedias.ts';
import { getUserPersonalGroup } from '../../features/projects/api/getUserPersonalGroup.ts';
import { UserGroup, UserGroupTypes } from '../../features/user-group/types/types.ts';
import { AllManifests } from '../../features/manifest/component/AllManifests.tsx';
import { getUserGroupManifests } from '../../features/manifest/api/getUserGroupManifests.ts';
import { Manifest, ManifestGroupRights } from '../../features/manifest/types/types.ts';
import { getAllUserGroups } from '../../features/user-group/api/getAllUserGroups.ts';
import { UserSettings } from '../../features/user-setting/UserSettings.tsx';
import { SidePanelManifest } from '../../features/manifest/component/SidePanelManifest.tsx';
import { handleLock } from '../../features/projects/api/handleLock.ts';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { AdminPanel } from '../../features/admin/components/adminPanel.tsx';
import { useTranslation } from 'react-i18next';
import { loadLanguage } from '../../features/translation/i18n.ts';
import { SaveProject } from './SideDrawer/SaveProject';
import { SideDrawerHeader } from './SideDrawer/SideDrawerHeaderHeader';
import { SideDrawerContentMenu } from './SideDrawer/SideDrawerContentMenu';

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


const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
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
  }),
);

interface ISideDrawerProps {
  user: User,
  handleDisconnect: () => void
  selectedProjectId?: number
  setSelectedProjectId: (id?: number) => void
  setViewer: Dispatch<any>
  viewer: any
}

interface MiradorViewerHandle {
  saveProject: () => void;
  setViewer: () => IState;
}


export const MENU_ELEMENT = {
  PROJECTS: 'PROJECT',
  GROUPS: 'GROUPS',
  MEDIA: 'MEDIA',
  MANIFEST: 'MANIFEST',
  SETTING: 'SETTING',
  ADMIN: 'ADMIN',
};


export const SideDrawer = ({
                             user,
                             handleDisconnect,
                             selectedProjectId,
                             setSelectedProjectId,
                             setViewer,
                             viewer,
                           }: ISideDrawerProps) => {
  const [isSideDrawerExpanded, setIsSideDrawerExpanded] = useState(true);
  const [selectedContent, setSelectedContent] = useState(MENU_ELEMENT.PROJECTS);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [modalDisconectIsOpen, setModalDisconectIsOpen] = useState(false);
  const [miradorState, setMiradorState] = useState<IState | undefined>();
  const [userPersonalGroup, setUserPersonalGroup] = useState<UserGroup>();
  const [medias, setMedias] = useState<Media[]>([]);
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [createManifestIsOpen, setCreateManifestIsOpen] = useState(false);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const myRef = useRef<MiradorViewerHandle>(null);
  const { t } = useTranslation();

  const loadPreferredLanguage = async () => {
    await loadLanguage(user.preferredLanguage);
  };
  useEffect(() => {
    if (myRef.current !== null) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          saveProject();
        }, 50000);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [myRef.current, isRunning]);

  useEffect(() => {
    loadPreferredLanguage();
  }, [user]);
  const handleSetCreateManifestIsOpen = (boolean: boolean) => {
    setCreateManifestIsOpen(boolean);
  };

  const HandleSetIsRunning = () => {
    setIsRunning(!isRunning);
  };

  const handleDrawerOpen = () => {
    setIsSideDrawerExpanded(true);
  };

  const handleSaveProject = useCallback((newProject: Project) => {
    return setUserProjects([newProject, ...userProjects]);

  }, [setUserProjects]);

  const handleDrawerClose = () => {
    setIsSideDrawerExpanded(false);
  };

  const handleChangeContent = (content: string) => {
    if (selectedProjectId) {
      saveProject(true);
    }
    setSelectedProjectId(undefined);
    setSelectedContent(content);
    handleSetCreateManifestIsOpen(false);
  };


  const HandleSetUserProjects = (userProjects: Project[]) => {
    const uniqueProjects = Array.from(new Set(userProjects.map((project: Project) => project.id)))
      .map(id => {
        return userProjects.find((project: Project) => project.id === id);
      }) as Project[];

    const sortedProjects = uniqueProjects.sort((a, b) => {
      return b.created_at!.toDate().getTime() - a.created_at!.toDate().getTime();
    });

    setUserProjects(sortedProjects);
  };

  const HandleSetMiradorState = (state: IState | undefined) => {
    setMiradorState(state);
  };

  const fetchUserPersonalGroup = async () => {
    try {
      const personalGroup = await getUserPersonalGroup(user.id);
      setUserPersonalGroup(personalGroup);
      return personalGroup;
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMediaForUser = async () => {
    const allMedias: Media[] = [];
    const personalGroup = await fetchUserPersonalGroup();

    const personalGroupMedias = await getUserGroupMedias(personalGroup!.id);
    allMedias.push(...personalGroupMedias);

    for (const group of groups) {
      const groupMedias = await getUserGroupMedias(group.id);
      allMedias.push(...groupMedias);
    }

    const rightsPriority = {
      [MediaGroupRights.ADMIN]: 3,
      [MediaGroupRights.EDITOR]: 2,
      [MediaGroupRights.READER]: 1,
    };

    const uniqueMediasMap = new Map<number, Media>();

    allMedias.forEach((media) => {
      const existing = uniqueMediasMap.get(media.id);

      if (
        !existing ||
        (media.rights &&
          rightsPriority[media.rights] >
          (existing.rights ? rightsPriority[existing.rights] : 0))
      ) {
        uniqueMediasMap.set(media.id, media);
      }
    });

    const uniqueMedias = Array.from(uniqueMediasMap.values());

    setMedias(uniqueMedias);
  };

  const getManifestFromUrl = async (manifestUrl: string) => {
    try {
      const response = await fetch(manifestUrl);
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  };

  const fetchManifestForUser = async () => {
    const allManifests: Manifest[] = [];
    const personalGroup = await fetchUserPersonalGroup();

    const userManifests = await getUserGroupManifests(personalGroup!.id);
    allManifests.push(...userManifests);

    for (const group of groups) {
      const manifestsGroup = await getUserGroupManifests(group!.id);
      allManifests.push(...manifestsGroup);
    }

    const rightsPriority = {
      [ManifestGroupRights.ADMIN]: 3,
      [ManifestGroupRights.EDITOR]: 2,
      [ManifestGroupRights.READER]: 1,
    };

    const uniqueManifestsMap = new Map<number, Manifest>();

    allManifests.forEach((manifest) => {
      const existing = uniqueManifestsMap.get(manifest.id);

      if (!existing ||
        (manifest.rights &&
          rightsPriority[manifest.rights] > (existing.rights ? rightsPriority[existing.rights] : 0))) {
        uniqueManifestsMap.set(manifest.id, manifest);
      }
    });

    const uniqueManifests = Array.from(uniqueManifestsMap.values());

    const updatedManifests = await Promise.all(
      uniqueManifests.map(async (manifest) => {
        const manifestJson = await getManifestFromUrl(manifest.path);
        return { ...manifest, json: manifestJson };
      }),
    );
    setManifests(updatedManifests);
  };


  const fetchGroups = async () => {
    let groups = await getAllUserGroups(user.id);
    groups = groups.filter((group: UserGroup) => group.type == UserGroupTypes.MULTI_USER);
    setGroups(groups);
  };


  const saveMiradorState = useCallback(async () => {
    const miradorViewer = myRef.current?.setViewer();
    if (selectedProjectId) {
      let projectToUpdate: Project = userProjects.find(projectUser => projectUser.id == selectedProjectId)!;
      //TODO FIX THIS BECAUSE PROJECT TO UPDATE SHOULD NOT BE UNDEFINED
      if (projectToUpdate == undefined) {
        projectToUpdate = userProjects.find(projectUser => projectUser.id == selectedProjectId)!;
      }
      projectToUpdate.userWorkspace = miradorViewer!;
      if (projectToUpdate) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { rights, ...projectWithoutRights } = projectToUpdate;
        await updateProject({ project: projectWithoutRights });
        toast.success(`Project ${projectWithoutRights.title} saved`); // TODO Trad
      }
    } else {
      const project: CreateProjectDto = {
        title: t('defaultProjectTitle'),
        ownerId: user.id,
        userWorkspace: miradorViewer!,
        metadata: {},
      };
      const r = await createProject(project);
      if (r) {
        setSelectedProjectId(r.id);
        handleSaveProject({
          ...r,
          ...project,
          userWorkspace: miradorViewer!,
          id: r.id,
        });
      }
    }
  }, [handleSaveProject, setSelectedProjectId, user, userProjects]);

  const saveProject = async (redirect?: boolean) => {
    if (redirect !== true) {
      await handleLock({ projectId: selectedProjectId!, lock: true });
    } else {
      await handleLock({ projectId: selectedProjectId!, lock: false });
    }
    await saveMiradorState();
  };

  const handleSetDisconnectModalOpen = () => {
    setModalDisconectIsOpen(!modalDisconectIsOpen);
  };

  const handleDisonnectUser = () => {
    handleDisconnect();
    handleSetDisconnectModalOpen();
  };
  const handleSetMiradorState = (state: IState) => {
    setMiradorState(state);
  };

  const fetchProjects = async () => {
    try {
      const projects = await getUserAllProjects(user.id);
      const uniqueProjects = Array.from(new Set(projects.map((project: Project) => project.id)))
        .map(id => {
          return projects.find((project: Project) => project.id === id);
        });
      setUserProjects(uniqueProjects);
    } catch (error) {
      console.error(t('errorFetchProject'), error);
    }
  };

  const initializedWorkspace = async () => {
    await fetchGroups()
    await fetchProjects();
    await fetchMediaForUser();
    await fetchManifestForUser();
  }

  useEffect(() => {
    initializedWorkspace()
  }, [selectedProjectId]);


  const projectSelected = useMemo(() => {
    if (userProjects && selectedProjectId) {
      const foundProject = userProjects.find(userProject => userProject.id === selectedProjectId);
      return foundProject ? foundProject : null;
    }
    return null;
  }, [userProjects, selectedProjectId]);

  return (
    <>
      <Drawer variant="permanent" open={isSideDrawerExpanded} sx={{ maxHeight: '100vh' }}
      >
        <SideDrawerHeader isSideDrawerExpanded={isSideDrawerExpanded} handleDrawerClose={handleDrawerClose}
                          handleDrawerOpen={handleDrawerOpen} />
        <Divider />
        <SideDrawerContentMenu
          open={isSideDrawerExpanded}
          selectedContent={selectedContent}
          handleChangeContent={handleChangeContent}
        />
        <Divider />
        {
          selectedProjectId && (
            <>
              <SaveProject
                open={isSideDrawerExpanded}
                projectSelected={projectSelected}
                saveProject={saveProject} />
              <Divider />
            </>
          )
        }
        <List>
          {
            user._isAdmin && (
              <Tooltip title={t('titleAdmin')} placement="right">
                <ListItem sx={{ padding: 0 }}>
                  <ItemButton open={isSideDrawerExpanded} selected={false} icon={<AdminPanelSettingsIcon />}
                              text={t('admin')}
                              action={() => handleChangeContent(MENU_ELEMENT.ADMIN)} />
                </ListItem>
              </Tooltip>
            )
          }
          <Tooltip title={t('titleSettings')} placement="right">
            <ListItem sx={{ padding: 0 }}>
              <ItemButton open={isSideDrawerExpanded} selected={false} icon={<SettingsIcon />} text={t('settings')}
                          action={() => handleChangeContent(MENU_ELEMENT.SETTING)} />
            </ListItem>
          </Tooltip>
          <Tooltip title={t('titleDisconnect')} placement="right">
            <ListItem sx={{ padding: 0 }}>
              <ItemButton open={isSideDrawerExpanded} selected={false} icon={<LogoutIcon />} text={t('disconnect')}
                          action={handleSetDisconnectModalOpen} />
            </ListItem>
          </Tooltip>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, padding: 0, margin: 0, maxHeight: '100vh' }}>
        {selectedProjectId && projectSelected && (
          <SidePanelManifest manifest={manifests} userPersonalGroup={userPersonalGroup!} user={user}
                             fetchManifestForUser={fetchManifestForUser} display={true}>
            <Grid sx={{ paddingRight: 5 }}>
              <MiradorViewer
                language={user.preferredLanguage ? user.preferredLanguage : navigator.language.split('-')[0]}
                miradorState={miradorState!}
                setMiradorState={handleSetMiradorState}
                project={projectSelected}
                saveMiradorState={saveMiradorState}
                viewer={viewer}
                setViewer={setViewer}
                ref={myRef}
                HandleSetIsRunning={HandleSetIsRunning}
              />
            </Grid>
          </SidePanelManifest>
        )
        }
        {
          user && user.id && user._isAdmin && selectedContent === MENU_ELEMENT.ADMIN && (
            <AdminPanel />
          )
        }
        {user && user.id && selectedContent === MENU_ELEMENT.PROJECTS && !selectedProjectId && (
          <AllProjects
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            user={user}
            userProjects={userProjects}
            setUserProjects={HandleSetUserProjects}
            handleSetMiradorState={HandleSetMiradorState}
            medias={medias}
            setMedias={setMedias}
          />
        )}
        {
          user && user.id && !selectedProjectId && selectedContent === MENU_ELEMENT.MEDIA && (
            <AllMedias
              user={user}
              userPersonalGroup={userPersonalGroup!}
              medias={medias}
              fetchMediaForUser={fetchMediaForUser}
              setMedias={setMedias}
            />
          )
        }
        {
          user && user.id && selectedContent === MENU_ELEMENT.GROUPS && (
            <AllGroups
              setGroups={setGroups}
              groups={groups}
              fetchGroups={fetchGroups}
              userPersonalGroup={userPersonalGroup!}
              medias={medias}
              user={user}
              setMedias={setMedias}
            />
          )
        }
        {
          user && user.id && selectedContent === MENU_ELEMENT.MANIFEST && userPersonalGroup && (
            <AllManifests fetchMediaForUser={fetchMediaForUser} createManifestIsOpen={createManifestIsOpen}
                          setCreateManifestIsOpen={handleSetCreateManifestIsOpen} medias={medias} manifests={manifests}
                          fetchManifestForUser={fetchManifestForUser} user={user} userPersonalGroup={userPersonalGroup} />
          )
        }
        {
          user && user.id && selectedContent === MENU_ELEMENT.SETTING && (
            <UserSettings user={user} />
          )
        }
        {modalDisconectIsOpen && (
          <MMUModal openModal={modalDisconectIsOpen} setOpenModal={handleSetDisconnectModalOpen} width={400}
                    children={<ConfirmDisconnect handleDisconnect={handleDisonnectUser} />} />
        )
        }
      </Box>
    </>
  );
};
