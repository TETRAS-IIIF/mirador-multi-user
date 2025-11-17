import { Grid } from '@mui/material';
import MiradorViewer from '../../../features/mirador/Mirador';
import { UserGroup } from '../../../features/user-group/types/types';
import { SidePanel } from '../SidePanel/SidePanel.tsx';
import { Media } from '../../../features/media/types/types.ts';
import { Manifest } from '../../../features/manifest/types/types.ts';
import { User } from '../../../features/auth/types/types.ts';
import { ITEM_RIGHTS } from '../../../utils/types.ts';

interface ProjectWorkspaceProps {
  HandleSetIsRunning: () => void;
  fetchManifestForUser: () => void;
  handleSetMiradorState: (state: any) => void;
  miradorState: any;
  myRef: any;
  projectSelected: any;
  saveMiradorState: (state: any) => void;
  user: User;
  userPersonalGroup: UserGroup;
  viewer: any;
  setViewer: (viewer: any) => void;
  manifests: Manifest[];
  medias: Media[];
  fetchMediaForUser: () => void;
}

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
  medias,
  fetchMediaForUser,
}: ProjectWorkspaceProps) {
  const isEditor = projectSelected.rights !== ITEM_RIGHTS.READER;

  return (
    <SidePanel
      medias={medias}
      manifests={manifests}
      userPersonalGroup={userPersonalGroup!}
      user={user}
      fetchMediaForUser={fetchMediaForUser}
      fetchManifestForUser={fetchManifestForUser}
      display={true}
    >
      <Grid sx={{ paddingRight: 5 }}>
        <MiradorViewer
          language={
            user.preferredLanguage
              ? user.preferredLanguage
              : navigator.language.split('-')[0]
          }
          miradorState={miradorState!}
          setMiradorState={handleSetMiradorState}
          project={projectSelected}
          saveMiradorState={saveMiradorState}
          viewer={viewer}
          setViewer={setViewer}
          ref={myRef}
          HandleSetIsRunning={HandleSetIsRunning}
          useEditionPlugins={isEditor}
          user={user}
        />
      </Grid>
    </SidePanel>
  );
}
