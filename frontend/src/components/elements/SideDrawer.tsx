import {
  Dispatch,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { updateProject } from "../../features/projects/api/updateProject.ts";
import {
  CreateProjectDto,
  Project,
} from "../../features/projects/types/types.ts";
import IState from "../../features/mirador/interface/IState.ts";
import { getUserAllProjects } from "../../features/projects/api/getUserAllProjects.ts";
import { createProject } from "../../features/projects/api/createProject.ts";
import toast from "react-hot-toast";
import { User } from "../../features/auth/types/types.ts";
import { Media, MediaGroupRights } from "../../features/media/types/types.ts";
import { getUserPersonalGroup } from "../../features/projects/api/getUserPersonalGroup.ts";
import {
  ItemsRights,
  UserGroup,
  UserGroupTypes,
} from "../../features/user-group/types/types.ts";
import { getAllUserGroups } from "../../features/user-group/api/getAllUserGroups.ts";
import { handleLock } from "../../features/projects/api/handleLock.ts";
import { useTranslation } from "react-i18next";
import { loadLanguage } from "../../features/translation/i18n.ts";
import { Content } from "./SideDrawer/Content";
import { MMUDrawer } from "./SideDrawer/MMUDrawer";
import { getUserGroupMedias } from "../../features/media/api/getUserGroupMedias";
import {
  Manifest,
  ManifestGroupRights,
} from "../../features/manifest/types/types";
import { getUserGroupManifests } from "../../features/manifest/api/getUserGroupManifests";

interface ISideDrawerProps {
  user: User;
  handleDisconnect: () => void;
  selectedProjectId?: number;
  setSelectedProjectId: (id?: number) => void;
  viewer: any;
  setViewer: Dispatch<any>;
}

interface MiradorViewerHandle {
  saveProject: () => void;
  setViewer: () => IState;
}

export const MENU_ELEMENT = {
  PROJECTS: "PROJECT",
  GROUPS: "GROUPS",
  MEDIA: "MEDIA",
  MANIFEST: "MANIFEST",
  SETTING: "SETTING",
  ADMIN: "ADMIN",
};

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

  const { t } = useTranslation();

  useEffect(() => {
    if (miradorViewerRef.current !== null) {
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

    const sortedProjects = uniqueProjects.sort((a, b) => {
      return (
        b.created_at!.toDate().getTime() - a.created_at!.toDate().getTime()
      );
    });

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
    const allManifests: Manifest[] = [];

    // Fetch user manifests
    const userManifests = await getUserGroupManifests(userPersonalGroup!.id);
    allManifests.push(...userManifests);

    // Fetch group manifests
    for (const group of groups) {
      const manifestsGroup = await getUserGroupManifests(group!.id);
      for (const manifest of manifestsGroup) {
        allManifests.push({ ...manifest, share: "group" });
      }
    }

    const rightsPriority = {
      [ManifestGroupRights.ADMIN]: 3,
      [ManifestGroupRights.EDITOR]: 2,
      [ManifestGroupRights.READER]: 1,
    };

    const uniqueManifestsMap = new Map<number, Manifest>();

    allManifests.forEach((manifest) => {
      const existing = uniqueManifestsMap.get(manifest.id);
      if (
        !existing ||
        (manifest.rights &&
          rightsPriority[manifest.rights] >
            (existing.rights ? rightsPriority[existing.rights] : 0))
      ) {
        // Add or replace with the manifest that has higher rights
        uniqueManifestsMap.set(manifest.id, manifest);
        console.log(existing);
      } else if (existing && manifest.share && !existing.share) {
        console.log(existing);
        // Propagate the `share` field if it's missing in the existing manifest
        existing.share = manifest.share;
      }
    });

    const uniqueManifests = Array.from(uniqueManifestsMap.values());

    // Fetch and add manifest JSON
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
    groups = groups.filter(
      (group: UserGroup) => group.type == UserGroupTypes.MULTI_USER,
    );
    setGroups(groups);
  };

  const saveMiradorState = useCallback(async () => {
    const miradorViewer = miradorViewerRef.current?.setViewer();
    if (selectedProjectId) {
      let projectToUpdate: Project = userProjects.find(
        (projectUser) => projectUser.id == selectedProjectId,
      )!;
      //TODO FIX THIS BECAUSE PROJECT TO UPDATE SHOULD NOT BE UNDEFINED
      if (projectToUpdate == undefined) {
        projectToUpdate = userProjects.find(
          (projectUser) => projectUser.id == selectedProjectId,
        )!;
      }
      projectToUpdate.userWorkspace = miradorViewer!;
      if (projectToUpdate) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { rights, share, ...projectWithoutRights } = projectToUpdate;
        await updateProject({ project: projectWithoutRights });
        toast.success(`Project ${projectWithoutRights.title} saved`); // TODO Trad
      }
    } else {
      const project: CreateProjectDto = {
        title: t("defaultProjectTitle"),
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
            return currRightsIndex > prevRightsIndex ? curr : prev;
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
      console.error(t("errorFetchProject"), error);
    }
  }, [user.id]);

  const fetchMediaForUser = async () => {
    const allMedias: Media[] = [];

    // Handle the case where `userPersonalGroup` might be null on the first render
    if (!userPersonalGroup) {
      console.warn("userPersonalGroup is null on first render");
      return;
    }

    // Fetch personal group media
    const personalGroupMedias = await getUserGroupMedias(userPersonalGroup.id);
    allMedias.push(...personalGroupMedias);

    // Fetch group media
    for (const group of groups) {
      const groupMedias = await getUserGroupMedias(group.id);
      for (const media of groupMedias) {
        // Ensure media from groups includes the "share" field
        allMedias.push({ ...media, share: "group" });
      }
    }

    const rightsPriority = {
      [MediaGroupRights.ADMIN]: 3,
      [MediaGroupRights.EDITOR]: 2,
      [MediaGroupRights.READER]: 1,
    };

    // Create a map to store unique media items based on their `id`
    const uniqueMediasMap = new Map<number, Media>();

    allMedias.forEach((media) => {
      const existing = uniqueMediasMap.get(media.id);

      if (
        !existing ||
        (media.rights &&
          rightsPriority[media.rights] >
            (existing.rights ? rightsPriority[existing.rights] : 0))
      ) {
        // Add or replace the media item with higher rights
        uniqueMediasMap.set(media.id, media);
      } else if (existing && media.share && !existing.share) {
        // Propagate the `share` field if it's missing in the existing media item
        existing.share = media.share;
      }
    });

    const uniqueMedias = Array.from(uniqueMediasMap.values());

    setMedias(uniqueMedias);
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
      />
      <Content
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
        setGroups={setGroups}
        setMedias={setMedias}
        setSelectedProjectId={setSelectedProjectId}
        setShowSignOutModal={setShowSignOutModal}
        setViewer={setViewer}
        showSignOutModal={showSignOutModal}
        user={user}
        userPersonalGroup={userPersonalGroup!}
        userProjects={userProjects}
        viewer={viewer}
        fetchProjects={fetchProjects}
      />
    </>
  );
};
