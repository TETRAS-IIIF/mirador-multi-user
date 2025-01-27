import { SidePanelManifest } from '../../../features/manifest/component/SidePanelManifest';
import { Grid } from '@mui/material';
import MiradorViewer from '../../../features/mirador/Mirador';
import { ItemsRights } from '../../../features/user-group/types/types';

export function ProjectWorkspace({
                                   HandleSetIsRunning,
                                   fetchManifestForUser,
                                   handleSetMiradorState,
                                   miradorState,
                                   myRef,
                                   projectSelected,
                                   saveMiradorState,
                                   user,
                                   userPersonalGroup,
                                   viewer,
                                   setViewer,
                                   manifests,
                                 }) {

  const isEditor = projectSelected.rights !== ItemsRights.READER;

  return (
    <SidePanelManifest
      manifest={manifests}
      userPersonalGroup={userPersonalGroup!}
      user={user}
      fetchManifestForUser={fetchManifestForUser}
      display={true}
    >
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
          useEditionPlugins={isEditor}
        />
      </Grid>
    </SidePanelManifest>
  );
}
