import { useState } from 'react';
import { Box, Fab, Grid, Tooltip } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useTranslation } from 'react-i18next';
import { AssistantPanel } from '../../../features/assistant/components/AssistantPanel.tsx';
import { isAssistantEnabled } from '../../../features/assistant/api.ts';
import MiradorViewer from '../../../features/mirador/Mirador';
import { UserGroup } from '../../../features/user-group/types/types';
import { SidePanel } from '../SidePanel/SidePanel.tsx';
import { Media } from '../../../features/media/types/types.ts';
import { Manifest } from '../../../features/manifest/types/types.ts';
import { User } from '../../../features/auth/types/types.ts';
import { ITEM_RIGHTS } from '../../../utils/mmu_types.ts';

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
  const { t } = useTranslation();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const language = user.preferredLanguage
    ? user.preferredLanguage
    : navigator.language.split('-')[0];

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
      <Box sx={{ display: 'flex', height: '100%', position: 'relative' }}>
        <Grid sx={{ paddingRight: 5, flexGrow: 1, minWidth: 0 }}>
          <MiradorViewer
            language={language}
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
        {isAssistantEnabled() && assistantOpen && (
          <AssistantPanel
            projectId={projectSelected.id}
            viewer={viewer}
            language={language}
            onClose={() => setAssistantOpen(false)}
          />
        )}
        {isAssistantEnabled() && !assistantOpen && (
          <Tooltip title={t('assistant.open')}>
            <Fab
              color="primary"
              size="medium"
              aria-label={t('assistant.open')}
              onClick={() => setAssistantOpen(true)}
              sx={{ position: 'absolute', bottom: 96, right: 64, zIndex: 1100 }}
            >
              <ChatIcon />
            </Fab>
          </Tooltip>
        )}
      </Box>
    </SidePanel>
  );
}
