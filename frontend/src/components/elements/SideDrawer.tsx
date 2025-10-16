import {
  Dispatch,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { updateProject } from '../../features/projects/api/Project/updateProject.ts';
import {
  CreateProjectDto,
  Project,
} from '../../features/projects/types/types.ts';
import IState from '../../features/mirador/interface/IState.ts';
import { getUserAllProjects } from '../../features/projects/api/Project/getUserAllProjects.ts';
import { createProject } from '../../features/projects/api/Project/createProject.ts';
import { User } from '../../features/auth/types/types.ts';
import { Media } from '../../features/media/types/types.ts';
import { getUserPersonalGroup } from '../../features/projects/api/group/getUserPersonalGroup.ts';
import {
  ItemsRights,
  UserGroup,
  UserGroupTypes,
} from '../../features/user-group/types/types.ts';
import { getAllUserGroups } from '../../features/user-group/api/getAllUserGroups.ts';
import { handleLock } from '../../features/projects/api/Project/handleLock.ts';
import { useTranslation } from 'react-i18next';
import { loadLanguage } from '../../features/translation/i18n.ts';
import { Content } from './SideDrawer/Content';
import { MMUDrawer } from './SideDrawer/MMUDrawer';
import { getUserMedias } from '../../features/media/api/getUserMedias.ts';

import { Manifest } from '../../features/manifest/types/types';
import { MENU_ELEMENT } from '../../utils/utils.ts';
import { generateSnapshot } from '../../features/projects/api/snapshot/generateProjectSnapShot.ts';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { getUserManifests } from '../../features/manifest/api/getUserGroupManifests.ts';

interface ISideDrawerProps {
  handleDisconnect: () => void;
  selectedProjectId?: number;
  setSelectedProjectId: (id?: number) => void;
  setViewer: Dispatch<any>;
  user: User;
  viewer: any;
}

interface MiradorViewerHandle {
  saveProject: () => void;
  setViewer: () => IState;
}

export const SideDrawer = ({
  user,
  handleDisconnect,
  selectedProjectId,
  setSelectedProjectId,
  setViewer,
  viewer,
}: ISideDrawerProps) => {
  const [selectedContent, setSelectedContent] = useState(MENU_ELEMENT.PROJECTS);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [miradorState, setMiradorState] = useState<IState | undefined>();

  const [userPersonalGroup, setUserPersonalGroup] = useState<UserGroup | null>(
    null,
  );
  const [medias, setMedias] = useState<Media[]>([]);

  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isMiradorRunning, setIsMiradorRunning] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const miradorViewerRef = useRef<MiradorViewerHandle>(null);

  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (miradorViewerRef.current !== null) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          saveProject();
        }, 50000);
      }
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [miradorViewerRef.current, isMiradorRunning]);

  useEffect(() => {
    fetchUserPersonalGroup();
    loadPreferredLanguage();
  }, [user]);

  const HandleSetIsRunning = () => {
    setIsMiradorRunning(!isMiradorRunning);
  };

  const loadPreferredLanguage = async () => {
    await loadLanguage(user.preferredLanguage);
  };

  const handleSaveProject = useCallback(
    (newProject: Project) => {
      return setUserProjects([newProject, ...userProjects]);
    },
    [setUserProjects],
  );

  const handleChangeContent = async (content: string) => {
    if (selectedProjectId) {
      await saveProject(true);
    }
    setSelectedProjectId(undefined);
    setSelectedContent(content);
  };

  const HandleSetUserProjects = (userProjects: Project[]) => {
    const uniqueProjects = Array.from(
      new Set(userProjects.map((project: Project) => project.id)),
    ).map((id) => {
      return userProjects.find((project: Project) => project.id === id);
    }) as Project[];

    const compareByCreatedAtDesc = (a: Project, b: Project) =>
      b.created_at!.toDate().getTime() - a.created_at!.toDate().getTime();

    const sortedProjects = uniqueProjects.sort(compareByCreatedAtDesc);

    setUserProjects(sortedProjects);
  };

  const handleSetMiradorState = (state: IState) => {
    setMiradorState(state);
  };

  const fetchUserPersonalGroup = async () => {
    try {
      const personalGroup = await getUserPersonalGroup(user.id);
      setUserPersonalGroup(personalGroup);
    } catch (error) {
      console.error(error);
    }
  };

  const [manifests, setManifests] = useState<Manifest[]>([]);

  const getManifestFromUrl = async (manifestUrl: string) => {
    try {
      const response = await fetch(manifestUrl);
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  };

  const fetchManifestForUser = async () => {
    const allManifests = await getUserManifests();

    const updatedManifests = await Promise.all(
      allManifests.map(async (manifest: Manifest) => {
        const manifestJson = await getManifestFromUrl(manifest.path);
        return { ...manifest, json: manifestJson };
      }),
    );

    setManifests(updatedManifests);
  };

  const fetchGroups = async () => {
    let groups = await getAllUserGroups(user.id);
    groups = groups.filter(
      (group: UserGroup) => group.type == UserGroupTypes.MULTI_USER,
    );
    setGroups(groups);
  };

  const saveMiradorState = useCallback(async () => {
    const miradorViewer = miradorViewerRef.current?.setViewer();
    if (selectedProjectId) {
      const projectToUpdate: Project = userProjects.find(
        (projectUser) => projectUser.id == selectedProjectId,
      )!;
      projectToUpdate.userWorkspace = miradorViewer!;
      if (projectToUpdate) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { rights, share, shared, ...projectWithoutRights } =
          projectToUpdate;
        const updatedResponse = await updateProject({
          project: projectWithoutRights,
        });
        if (updatedResponse) {
          toast.success(
            <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              {t('projectSaved', { projectTitle: updatedResponse.title })}
            </div>,
          );
        } else {
          toast.error(
            <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              {t('projectSavedFailed', {
                projectTitle: projectToUpdate.title,
              })}
            </div>,
          );
        }
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

  const handleGenerateSnapshot = async (projectId: number) => {
    const generated_at = dayjs(Date.now())
      .locale(i18n.language)
      .format('LLLL')
      .toString();

    const snapshot = await generateSnapshot({
      title: `Snapshot ${generated_at}`,
      projectId: projectId,
    });

    if (!snapshot) return;

    fetchProjects();
    if (snapshot) {
      toast.success(t('snapshot_success'));
    }
  };

  const saveProject = async (redirect?: boolean) => {
    if (redirect !== true) {
      await handleLock({ projectId: selectedProjectId!, lock: true });
    } else {
      await handleLock({ projectId: selectedProjectId!, lock: false });
    }
    await saveMiradorState();
  };

  const handleDisconnectUser = () => {
    handleDisconnect();
    setShowSignOutModal(false);
  };

  const fetchProjects = useCallback(async () => {
    try {
      const projects = await getUserAllProjects(user.id);

      const rightsOrder = [
        ItemsRights.READER,
        ItemsRights.EDITOR,
        ItemsRights.ADMIN,
      ];
      const uniqueProjects = Array.from(
        new Set(projects.map((project: Project) => project.id)),
      ).map((id) => {
        const allMatchingProjects = projects.filter(
          (project: Project) => project.id === id,
        );

        const highestRightsProject = allMatchingProjects.reduce(
          (prev: { rights: ItemsRights }, curr: { rights: ItemsRights }) => {
            const prevRightsIndex = prev.rights
              ? rightsOrder.indexOf(prev.rights)
              : -1;
            const currRightsIndex = curr.rights
              ? rightsOrder.indexOf(curr.rights)
              : -1;
            return currRightsIndex> prevRightsIndex ? curr : prev;
          },
        );

        allMatchingProjects.forEach((project: Project) => {
          if (project.share && !highestRightsProject.share) {
            highestRightsProject.share = project.share;
          }
        });

        return highestRightsProject;
      });
      setUserProjects(uniqueProjects);
    } catch (error) {
      console.error(t('errorFetchProject'), error);
    }
  }, [user.id]);

  const fetchMediaForUser = async () => {
    const allMedias = await getUserMedias();
    setMedias(allMedias);
  };

  const initializedWorkspace = async () => {
    await fetchUserPersonalGroup();
    await fetchGroups();
    await fetchProjects();
    await fetchMediaForUser();
    await fetchManifestForUser();
  };

  useEffect(() => {
    initializedWorkspace();
  }, [selectedProjectId]);

  const projectSelected = useMemo(() => {
    if (userProjects && selectedProjectId) {
      const foundProject = userProjects.find(
        (userProject) => userProject.id === selectedProjectId,
      );
      return foundProject ? foundProject : null;
    }
    return null;
  }, [userProjects, selectedProjectId]);

  return (
    <>
      <MMUDrawer
        selectedContent={selectedContent}
        handleChangeContent={handleChangeContent}
        projectSelected={projectSelected}
        saveProject={saveProject}
        setShowSignOutModal={setShowSignOutModal}
        user={user}
        handleGenerateSnapshot={handleGenerateSnapshot}/>
      <Content
        setMedias={setMedias}
        HandleSetIsRunning={HandleSetIsRunning}
        HandleSetUserProjects={HandleSetUserProjects}
        fetchGroups={fetchGroups}
        fetchManifestForUser={fetchManifestForUser}
        fetchMediaForUser={fetchMediaForUser}
        groups={groups}
        handleDisconnectUser={handleDisconnectUser}
        handleSetMiradorState={handleSetMiradorState}
        manifests={manifests}
        medias={medias}
        miradorState={miradorState}
        miradorViewerRef={miradorViewerRef}
        projectSelected={projectSelected}
        saveMiradorState={saveMiradorState}
        selectedContent={selectedContent}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        setShowSignOutModal={setShowSignOutModal}
        setViewer={setViewer}
        showSignOutModal={showSignOutModal}
        user={user}
        userPersonalGroup={userPersonalGroup!}
        userProjects={userProjects}
        viewer={viewer}
        fetchProjects={fetchProjects}/>
    </>
  );
};
