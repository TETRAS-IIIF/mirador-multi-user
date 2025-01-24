import { SidePanelManifest } from '../../../features/manifest/component/SidePanelManifest';
import { Box, Grid } from '@mui/material';
import MiradorViewer from '../../../features/mirador/Mirador';
import { AdminPanel } from '../../../features/admin/components/adminPanel';
import { AllProjects } from '../../../features/projects/components/AllProjects';
import { AllMedias } from '../../../features/media/component/AllMedias';
import { AllGroups } from '../../../features/user-group/components/AllGroups';
import { AllManifests } from '../../../features/manifest/component/AllManifests';
import { UserSettings } from '../../../features/user-setting/UserSettings';
import { MMUModal } from '../modal';
import { ConfirmDisconnect } from '../../../features/auth/components/confirmDisconect';
import { MENU_ELEMENT } from '../SideDrawer';


export function Content({
                          HandleSetIsRunning,
                          HandleSetUserProjects,
                          createManifestIsOpen,
                          fetchGroups,
                          fetchManifestForUser,
                          fetchMediaForUser,
                          groups,
                          handleDisonnectUser,
                          handleSetCreateManifestIsOpen,
                          handleSetDisconnectModalOpen,
                          handleSetMiradorState,
                          manifests,
                          medias,
                          miradorState,
                          modalDisconectIsOpen,
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
  )
}
