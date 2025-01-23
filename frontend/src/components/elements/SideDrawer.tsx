import { Box, CSSObject, Divider, Grid, IconButton, List, ListItem, styled, Theme, Tooltip } from '@mui/material';
import { Dispatch, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MuiDrawer from '@mui/material/Drawer';
import WorkIcon from '@mui/icons-material/Work';
import GroupsIcon from '@mui/icons-material/Groups';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { ItemButton } from './SideBar/ItemButton.tsx';
import { AllProjects } from '../../features/projects/components/AllProjects.tsx';
import { AllGroups } from '../../features/user-group/components/AllGroups.tsx';
import SaveIcon from '@mui/icons-material/Save';
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
import { Media } from '../../features/media/types/types.ts';
import { getUserGroupMedias } from '../../features/media/api/getUserGroupMedias.ts';
import { getUserPersonalGroup } from '../../features/projects/api/getUserPersonalGroup.ts';
import { UserGroup, UserGroupTypes } from '../../features/user-group/types/types.ts';
import { AllManifests } from '../../features/manifest/component/AllManifests.tsx';
import ArticleIcon from '@mui/icons-material/Article';
import { getUserGroupManifests } from '../../features/manifest/api/getUserGroupManifests.ts';
import { Manifest } from '../../features/manifest/types/types.ts';
import PermMediaIcon from '@mui/icons-material/PermMedia';
import { getAllUserGroups } from '../../features/user-group/api/getAllUserGroups.ts';
import { UserSettings } from '../../features/user-setting/UserSettings.tsx';
import { SidePanelManifest } from '../../features/manifest/component/SidePanelManifest.tsx';
import { handleLock } from '../../features/projects/api/handleLock.ts';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { AdminPanel } from '../../features/admin/components/adminPanel.tsx';
import { useTranslation } from 'react-i18next';
import { loadLanguage } from '../../features/translation/i18n.ts';

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

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

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


const CONTENT = {
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
  const [open, setOpen] = useState(true);
  const [selectedContent, setSelectedContent] = useState(CONTENT.PROJECTS);
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
    setOpen(true);
  };

  const handleSaveProject = useCallback((newProject: Project) => {
    return setUserProjects([newProject, ...userProjects]);

  }, [setUserProjects]);

  const handleDrawerClose = () => {
    setOpen(false);
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

    const uniqueMedias = Array.from(
      new Map(allMedias.map((media) => [media.id, media])).values()
    );

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

    console.log('groups into fetch manifest', groups)
    for (const group of groups) {
      console.log('group',group)
      const manifestsGroup = await getUserGroupManifests(group!.id);
      allManifests.push(...manifestsGroup);
    }
  console.log('allManifests',allManifests);
    const uniqueManifests = Array.from(
      new Map(allManifests.map((manifest) => [manifest.id, manifest])).values()
    );

    console.log('uniqueManifests',uniqueManifests);

    const updatedManifests = await Promise.all(
      uniqueManifests.map(async (manifest) => {
        const manifestJson = await getManifestFromUrl(manifest.path);
        return { ...manifest, json: manifestJson };
      })
    );

    setManifests(updatedManifests);
  };

  const fetchGroups = async () => {
    console.log('FETCH GROUPS')
    let groups = await getAllUserGroups(user.id);
    groups = groups.filter((group: UserGroup) => group.type == UserGroupTypes.MULTI_USER);
    console.log('groups',groups);
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

  const initializedWorkspace = async ()=> {
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
      <Drawer variant="permanent" open={open} sx={{ maxHeight: '100vh' }}
      >
        <DrawerHeader>
          <IconButton onClick={open ? handleDrawerClose : handleDrawerOpen}>
            {!open ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List sx={{ minHeight: '70vh', flexGrow: 1 }}>
          <Tooltip title={t('projectTitle')} placement="right">
            <ListItem sx={{ padding: 0 }}>
              <ItemButton selected={CONTENT.PROJECTS === selectedContent} open={open} icon={<WorkIcon />}
                          text={t('project')} action={() => handleChangeContent(CONTENT.PROJECTS)} />
            </ListItem>
          </Tooltip>
          <Tooltip title={t('manifestTitle')} placement="right">
            <ListItem sx={{ padding: 0 }}>
              <ItemButton open={open} selected={CONTENT.MANIFEST === selectedContent} icon={<ArticleIcon />}
                          text={t('manifests')} action={() => handleChangeContent(CONTENT.MANIFEST)} />
            </ListItem>
          </Tooltip>
          <Tooltip title={t('mediaTitle')} placement="right">
            <ListItem sx={{ padding: 0 }}>
              <ItemButton open={open} selected={CONTENT.MEDIA === selectedContent} icon={<PermMediaIcon />}
                          text={t('media')} action={() => handleChangeContent(CONTENT.MEDIA)} />
            </ListItem>
          </Tooltip>
          <Tooltip title={t('groupTitle')} placement="right">
            <ListItem sx={{ padding: 0 }}>
              <ItemButton open={open} selected={CONTENT.GROUPS === selectedContent} icon={<GroupsIcon />}
                          text={t('group')} action={() => handleChangeContent(CONTENT.GROUPS)} />
            </ListItem>
          </Tooltip>
        </List>
        <Divider />
        {
          selectedProjectId && (
            <>
              <List>
                <Tooltip title={projectSelected!.title} placement="left">
                  <ListItem sx={{ padding: 0 }}>
                    <ItemButton icon={<WorkIcon />} text={projectSelected!.title} open={open} selected={false}
                                action={() => console.log('')} />
                  </ListItem>
                </Tooltip>
                <Divider />
                <Tooltip title={t('save')} placement="left">
                  <ListItem sx={{ padding: 0 }}>
                    <ItemButton open={open} selected={false} icon={<SaveIcon />} text={t('saveProject')}
                                action={saveProject} />
                  </ListItem>
                </Tooltip>
              </List>
              <Divider />
            </>
          )
        }
        <List>
          {
            user._isAdmin && (
              <Tooltip title={t('titleAdmin')} placement="right">
                <ListItem sx={{ padding: 0 }}>
                  <ItemButton open={open} selected={false} icon={<AdminPanelSettingsIcon />} text={t('admin')}
                              action={() => handleChangeContent(CONTENT.ADMIN)} />
                </ListItem>
              </Tooltip>
            )
          }
          <Tooltip title={t('titleSettings')} placement="right">
            <ListItem sx={{ padding: 0 }}>
              <ItemButton open={open} selected={false} icon={<SettingsIcon />} text={t('settings')}
                          action={() => handleChangeContent(CONTENT.SETTING)} />
            </ListItem>
          </Tooltip>
          <Tooltip title={t('titleDisconnect')} placement="right">
            <ListItem sx={{ padding: 0 }}>
              <ItemButton open={open} selected={false} icon={<LogoutIcon />} text={t('disconnect')}
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
          user && user.id && user._isAdmin && selectedContent === CONTENT.ADMIN && (
            <AdminPanel />
          )
        }
        {user && user.id && selectedContent === CONTENT.PROJECTS && !selectedProjectId && (
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
          user && user.id && !selectedProjectId && selectedContent === CONTENT.MEDIA && (
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
          user && user.id && selectedContent === CONTENT.GROUPS && (
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
          user && user.id && selectedContent === CONTENT.MANIFEST && userPersonalGroup && (
            <AllManifests fetchMediaForUser={fetchMediaForUser} createManifestIsOpen={createManifestIsOpen}
                          setCreateManifestIsOpen={handleSetCreateManifestIsOpen} medias={medias} manifests={manifests}
                          fetchManifestForUser={fetchManifestForUser} user={user} userPersonalGroup={userPersonalGroup} />
          )
        }
        {
          user && user.id && selectedContent === CONTENT.SETTING && (
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
