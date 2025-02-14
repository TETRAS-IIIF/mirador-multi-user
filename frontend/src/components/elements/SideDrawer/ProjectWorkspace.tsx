import { SidePanelManifest } from "../../../features/manifest/component/SidePanelManifest";
import { Grid } from "@mui/material";
import MiradorViewer from "../../../features/mirador/Mirador";
import { ItemsRights } from "../../../features/user-group/types/types";

interface ProjectWorkspaceProps {
  HandleSetIsRunning: () => void;
  fetchManifestForUser: () => void;
  handleSetMiradorState: (state: any) => void;
  miradorState: any;
  myRef: any;
  projectSelected: any;
  saveMiradorState: (state: any) => void;
  user: any;
  userPersonalGroup: any;
  viewer: any;
  setViewer: (viewer: any) => void;
  manifests: any;
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
}: ProjectWorkspaceProps) {
  const isEditor = projectSelected.rights !== ItemsRights.READER;

  return (
    <SidePanelManifest
      manifests={manifests}
      userPersonalGroup={userPersonalGroup!}
      user={user}
      fetchManifestForUser={fetchManifestForUser}
      display={true}
    >
      <Grid sx={{ paddingRight: 5 }}>
        <MiradorViewer
          language={
            user.preferredLanguage
              ? user.preferredLanguage
              : navigator.language.split("-")[0]
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
    </SidePanelManifest>
  );
}
