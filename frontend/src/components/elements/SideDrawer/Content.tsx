import { Box } from "@mui/material";
import { AdminPanel } from "../../../features/admin/components/adminPanel";
import { AllProjects } from "../../../features/projects/components/AllProjects";
import { AllMedias } from "../../../features/media/component/AllMedias";
import { AllGroups } from "../../../features/user-group/components/AllGroups";
import { AllManifests } from "../../../features/manifest/component/AllManifests";
import { UserSettings } from "../../../features/user-setting/UserSettings";
import { MMUModal } from "../modal";
import { ConfirmDisconnect } from "../../../features/auth/components/confirmDisconect";
import { MENU_ELEMENT } from "../SideDrawer";
import { ProjectWorkspace } from "./ProjectWorkspace";
import { User } from "../../../features/auth/types/types.ts";
import { UserGroup } from "../../../features/user-group/types/types.ts";
import { Manifest } from "../../../features/manifest/types/types.ts";
import { Media } from "../../../features/media/types/types.ts";
import { Project } from "../../../features/projects/types/types.ts";

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
      sx={{ flexGrow: 1, padding: 0, margin: 0, maxHeight: "100vh" }}
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
        />
      )}
      {user &&
        user.id &&
        user._isAdmin &&
        selectedContent === MENU_ELEMENT.ADMIN && <AdminPanel />}
      {user &&
        user.id &&
        selectedContent === MENU_ELEMENT.PROJECTS &&
        !selectedProjectId && (
          <AllProjects
            handleSetMiradorState={handleSetMiradorState}
            medias={medias}
            selectedProjectId={selectedProjectId}
            fetchMediaForUser={fetchMediaForUser}
            setSelectedProjectId={setSelectedProjectId}
            setUserProjects={HandleSetUserProjects}
            user={user}
            userProjects={userProjects}
            fetchProjects={fetchProjects}
          />
        )}
      {user &&
        user.id &&
        !selectedProjectId &&
        selectedContent === MENU_ELEMENT.MEDIA && (
          <AllMedias
            fetchMediaForUser={fetchMediaForUser}
            medias={medias}
            user={user}
            userPersonalGroup={userPersonalGroup}
          />
        )}
      {user && user.id && selectedContent === MENU_ELEMENT.GROUPS && (
        <AllGroups
          fetchGroups={fetchGroups}
          groups={groups}
          medias={medias}
          fetchMediaForUser={fetchMediaForUser}
          user={user}
          userPersonalGroup={userPersonalGroup}
        />
      )}
      {user && user.id && selectedContent === MENU_ELEMENT.MANIFEST && (
        <AllManifests
          fetchManifestForUser={fetchManifestForUser}
          fetchMediaForUser={fetchMediaForUser}
          manifests={manifests}
          medias={medias}
          user={user}
          userPersonalGroup={userPersonalGroup}
        />
      )}
      {user && user.id && selectedContent === MENU_ELEMENT.SETTING && (
        <UserSettings user={user} />
      )}
      {showSignOutModal && (
        <MMUModal
          openModal={showSignOutModal}
          setOpenModal={setShowSignOutModal}
          width={400}
          children={
            <ConfirmDisconnect handleDisconnect={handleDisconnectUser} />
          }
        />
      )}
    </Box>
  );
}
