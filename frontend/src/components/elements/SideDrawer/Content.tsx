import { Box } from '@mui/material';
import { AllProjects } from '../../../features/projects/components/AllProjects';
import { AllMedias } from '../../../features/media/component/AllMedias';
import { AllGroups } from '../../../features/user-group/components/AllGroups';
import { AllManifests } from '../../../features/manifest/component/AllManifests';
import { UserSettings } from '../../../features/user-setting/UserSettings';
import { MMUModal } from '../modal';
import { ConfirmDisconnect } from '../../../features/auth/components/confirmDisconect';
import { ProjectWorkspace } from './ProjectWorkspace';
import { User } from '../../../features/auth/types/types.ts';
import { UserGroup } from '../../../features/user-group/types/types.ts';
import { Manifest } from '../../../features/manifest/types/types.ts';
import { Media } from '../../../features/media/types/types.ts';
import { Project } from '../../../features/projects/types/types.ts';
import { Dispatch, SetStateAction } from 'react';
import { MENU_ELEMENT } from '../../../utils/utils.ts';
import { AdminPanel } from '../../../features/admin/components/AdminPanel.tsx';

interface ContentProps {
  HandleSetIsRunning: () => void;
  HandleSetUserProjects: (projects: any) => void;
  fetchGroups: () => void;
  fetchManifestForUser: () => void;
  fetchMediaForUser: () => void;
  groups: UserGroup[];
  handleDisconnectUser: () => void;
  handleSetMiradorState: (state: any) => void;
  manifests: Manifest[];
  medias: Media[];
  miradorState: any;
  miradorViewerRef: any;
  projectSelected: any;
  saveMiradorState: (state: any) => void;
  selectedContent: string;
  selectedProjectId: number | undefined;
  setMedias: Dispatch<SetStateAction<Media[]>>;
  setSelectedProjectId: (id: number | undefined) => void;
  setShowSignOutModal: (show: boolean) => void;
  setViewer: (viewer: any) => void;
  showSignOutModal: boolean;
  user: User;
  userPersonalGroup: UserGroup;
  userProjects: Project[];
  viewer: any;
  fetchProjects: () => void;
}

export function Content({
  HandleSetIsRunning,
  HandleSetUserProjects,
  fetchGroups,
  fetchProjects,
  fetchManifestForUser,
  fetchMediaForUser,
  groups,
  handleDisconnectUser,
  handleSetMiradorState,
  manifests,
  medias,
  miradorState,
  miradorViewerRef,
  projectSelected,
  saveMiradorState,
  selectedContent,
  selectedProjectId,
  setMedias,
  setSelectedProjectId,
  setShowSignOutModal,
  setViewer,
  showSignOutModal,
  user,
  userPersonalGroup,
  userProjects,
  viewer,
}: ContentProps) {
  return (
    <Box
      component="main"
      sx={{ flexGrow: 1, padding: 0, margin: 0, maxHeight: '100vh' }}
    >
      {selectedProjectId && projectSelected && (
        <ProjectWorkspace
          HandleSetIsRunning={HandleSetIsRunning}
          fetchManifestForUser={fetchManifestForUser}
          handleSetMiradorState={handleSetMiradorState}
          manifests={manifests}
          miradorState={miradorState!}
          myRef={miradorViewerRef}
          projectSelected={projectSelected}
          saveMiradorState={saveMiradorState}
          setViewer={setViewer}
          user={user}
          userPersonalGroup={userPersonalGroup}
          viewer={viewer}
          fetchMediaForUser={fetchMediaForUser}
          medias={medias}
        />
      )}
      {Boolean(
        user?.id && user._isAdmin && selectedContent === MENU_ELEMENT.ADMIN,
      ) && <AdminPanel />}
      {user &&
        user.id &&
        selectedContent === MENU_ELEMENT.PROJECTS &&
        !selectedProjectId && (
          <AllProjects
            handleSetMiradorState={handleSetMiradorState}
            medias={medias}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            setUserProjects={HandleSetUserProjects}
            user={user}
            userProjects={userProjects}
            fetchProjects={fetchProjects}
            fetchManifestForUser={fetchManifestForUser}
            manifests={manifests}
            fetchMediaForUser={fetchMediaForUser}
          />
        )}
      {Boolean(
        user?.id &&
          !selectedProjectId &&
          selectedContent === MENU_ELEMENT.MEDIA,
      ) && (
        <AllMedias
          fetchMediaForUser={fetchMediaForUser}
          medias={medias}
          setMedias={setMedias}
          user={user}
          userPersonalGroup={userPersonalGroup}
        />
      )}
      {Boolean(user?.id && selectedContent === MENU_ELEMENT.GROUPS) && (
        <AllGroups
          fetchGroups={fetchGroups}
          groups={groups}
          medias={medias}
          manifests={manifests}
          fetchManifestForUser={fetchManifestForUser}
          user={user}
          userPersonalGroup={userPersonalGroup}
          fetchMediaForUser={fetchMediaForUser}
        />
      )}
      {Boolean(user?.id && selectedContent === MENU_ELEMENT.MANIFEST) && (
        <AllManifests
          fetchManifestForUser={fetchManifestForUser}
          fetchMediaForUser={fetchMediaForUser}
          manifests={manifests}
          medias={medias}
          user={user}
          userPersonalGroup={userPersonalGroup}
        />
      )}
      {Boolean(user?.id && selectedContent === MENU_ELEMENT.SETTING) && (
        <UserSettings user={user} />
      )}
      {showSignOutModal && (
        <MMUModal
          openModal={showSignOutModal}
          setOpenModal={setShowSignOutModal}
          width={400}
        >
          <ConfirmDisconnect handleDisconnect={handleDisconnectUser} />
        </MMUModal>
      )}
    </Box>
  );
}
