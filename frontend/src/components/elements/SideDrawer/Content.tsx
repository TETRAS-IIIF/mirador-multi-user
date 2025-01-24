import { Box } from '@mui/material';
import { AdminPanel } from '../../../features/admin/components/adminPanel';
import { AllProjects } from '../../../features/projects/components/AllProjects';
import { AllMedias } from '../../../features/media/component/AllMedias';
import { AllGroups } from '../../../features/user-group/components/AllGroups';
import { AllManifests } from '../../../features/manifest/component/AllManifests';
import { UserSettings } from '../../../features/user-setting/UserSettings';
import { MMUModal } from '../modal';
import { ConfirmDisconnect } from '../../../features/auth/components/confirmDisconect';
import { MENU_ELEMENT } from '../SideDrawer';
import { ProjectWorkspace } from './ProjectWorkspace';


export function Content({
                          HandleSetIsRunning,
                          HandleSetUserProjects,
                          createManifestIsOpen,
                          fetchManifestForUser,
                          fetchMediaForUser,
                          fetchGroups,
                          groups,
                          handleDisconnectUser,
                          handleSetCreateManifestIsOpen,
                          setShowSignOutModal,
                          handleSetMiradorState,
                          manifests,
                          medias,
                          miradorState,
                          showSignOutModal,
                          myRef,
                          projectSelected,
                          saveMiradorState,
                          selectedContent,
                          selectedProjectId,
                          setGroups,
                          setMedias,
                          setSelectedProjectId,
                          setViewer,
                          user,
                          userPersonalGroup,
                          userProjects,
                          viewer,
                        }) {


  return (
    <Box component="main" sx={{ flexGrow: 1, padding: 0, margin: 0, maxHeight: '100vh' }}>
      {selectedProjectId && projectSelected && (
        <ProjectWorkspace
          HandleSetIsRunning={HandleSetIsRunning}
          fetchManifestForUser={fetchManifestForUser}
          handleSetMiradorState={handleSetMiradorState}
          miradorState={miradorState!}
          myRef={myRef}
          projectSelected={projectSelected}
          saveMiradorState={saveMiradorState}
          user={user}
          userPersonalGroup={userPersonalGroup!}
          viewer={viewer}
          setViewer={setViewer}
          manifests={manifests}
        />
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
          handleSetMiradorState={handleSetMiradorState}
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
            userPersonalGroup={userPersonalGroup!}
            medias={medias}
            user={user}
            setMedias={setMedias}
            fetchGroups={fetchGroups}
          />
        )
      }
      {
        user && user.id && selectedContent === MENU_ELEMENT.MANIFEST && userPersonalGroup && (
          <AllManifests
            fetchMediaForUser={fetchMediaForUser}
            createManifestIsOpen={createManifestIsOpen}
            setCreateManifestIsOpen={handleSetCreateManifestIsOpen}
            medias={medias}
            manifests={manifests}
            fetchManifestForUser={fetchManifestForUser}
            user={user}
            groups={groups}
            userPersonalGroup={userPersonalGroup}
          />
        )
      }
      {
        user && user.id && selectedContent === MENU_ELEMENT.SETTING && (
          <UserSettings user={user} />
        )
      }
      {showSignOutModal && (
        <MMUModal openModal={showSignOutModal} setOpenModal={setShowSignOutModal} width={400}
                  children={<ConfirmDisconnect handleDisconnect={handleDisconnectUser} />} />
      )
      }
    </Box>
  )
}
