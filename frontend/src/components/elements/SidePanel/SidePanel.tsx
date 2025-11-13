import {
  Box,
  Drawer,
  IconButton,
  IconButtonProps,
  styled,
} from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';
import { CloseButton } from '../SideBar/CloseButton.tsx';
import { OpenButton } from '../SideBar/OpenButton.tsx';
import { useTranslation } from 'react-i18next';
import { UserGroup } from '../../../features/user-group/types/types.ts';
import { User } from '../../../features/auth/types/types.ts';
import { Media } from '../../../features/media/types/types.ts';
import { Manifest } from '../../../features/manifest/types/types.ts';
import { ContentSidePanelMedia } from '../../../features/media/component/ContentSidePanelMedia.tsx';
import { ContentSidePanelManifest } from '../../../features/manifest/component/ContentSidePanelManifest.tsx';

const ToggleMediaButton = styled(IconButton)<{ open: boolean; shift: boolean }>(
  ({ open, shift }) => {
    const hasPanel = open || shift;
    const rightPosition = hasPanel ? 360 : -50;
    return {
      position: 'fixed',
      top: '130px',
      right: rightPosition,
      zIndex: 9999,
      transition: 'right 0.3s ease',
      '&:hover': {
        backgroundColor: 'transparent',
      },
    };
  },
);

interface ToggleButtonProps extends IconButtonProps {
  open: boolean;
}

export const ToggleButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'open',
})<ToggleButtonProps>(({ theme, open }) => ({
  position: 'fixed',
  top: open ? 40 : 40,
  right: open ? 400 : 0,
  zIndex: 9999,
  transition: theme.transitions.create('right', {
    duration: 300,
    easing: theme.transitions.easing.easeInOut,
  }),
  '&:hover': {
    backgroundColor: 'transparent',
  },
}));

const ToggleManifestButton = styled(IconButton)<{
  open: boolean;
  shift: boolean;
}>(({ open, shift }) => {
  const rightPosition = open || shift ? 335 : -70;

  return {
    position: 'fixed',
    top: '250px',
    right: rightPosition,
    zIndex: 9999,
    transition: 'right 0.3s ease',
    '&:hover': {
      backgroundColor: 'transparent',
    },
  };
});

interface SidePanelProps {
  medias: Media[];
  manifests: Manifest[];
  children: ReactNode;
  userPersonalGroup: UserGroup;
  user: User;
  fetchMediaForUser: () => void;
  fetchManifestForUser: () => void;
  display: boolean;
}

export const SidePanel = ({
  medias,
  manifests,
  children,
  fetchMediaForUser,
  fetchManifestForUser,
  display,
  user,
  userPersonalGroup,
}: SidePanelProps) => {
  const [openMedia, setOpenMedia] = useState(false);
  const [openManifest, setOpenManifest] = useState(false);
  const { t } = useTranslation();
  const handleSetOpenMedia = () => {
    setOpenMedia(!openMedia);
    setOpenManifest(false);
  };

  const handleSetOpenManifest = () => {
    setOpenManifest(!openManifest);
    setOpenMedia(false);
  };

  const handleOpenPanel = () => {
    setOpenMedia(!openMedia);
    setOpenManifest(false);
  };

  useEffect(() => {
    if (!display) {
      setOpenManifest(false);
      setOpenMedia(false);
    }
  }, [display]);
  return (
    <>
      {display && (
        <>
          <ToggleButton
            open={openMedia || openManifest}
            onClick={handleOpenPanel}
          >
            {openMedia || openManifest ? (
              <CloseButton text={t('')} />
            ) : (
              <OpenButton text={t('')} />
            )}
          </ToggleButton>

          {(openMedia || openManifest) && (
            <>
              <ToggleMediaButton
                open={openMedia}
                shift={openManifest}
                onClick={handleSetOpenMedia}
              >
                {openMedia ? (
                  <CloseButton text={t('Media')} isSelected={openMedia} />
                ) : (
                  <OpenButton text={t('Media')} isSelected={openMedia} />
                )}
              </ToggleMediaButton>

              <ToggleManifestButton
                open={openManifest}
                shift={openMedia}
                onClick={handleSetOpenManifest}
              >
                {openManifest ? (
                  <CloseButton
                    text={t('Manifests')}
                    isSelected={openManifest}
                  />
                ) : (
                  <OpenButton text={t('Manifests')} isSelected={openManifest} />
                )}
              </ToggleManifestButton>
            </>
          )}
        </>
      )}

      {openMedia && display && (
        <Drawer
          open={openMedia}
          anchor="right"
          variant="persistent"
          sx={{ position: 'relative', zIndex: 9999 }}
          ModalProps={{
            BackdropProps: {
              style: { backgroundColor: 'transparent' },
            },
          }}
        >
          <ContentSidePanelMedia
            medias={medias}
            open={openMedia}
            fetchMediaForUser={fetchMediaForUser}
            user={user}
            userPersonalGroup={userPersonalGroup}
          />
        </Drawer>
      )}

      {openManifest && display && (
        <Drawer
          open={openManifest}
          anchor="right"
          variant="persistent"
          sx={{ position: 'relative', zIndex: 9999 }}
          ModalProps={{
            BackdropProps: {
              style: { backgroundColor: 'transparent' },
            },
          }}
        >
          <ContentSidePanelManifest
            user={user}
            userPersonalGroup={userPersonalGroup}
            manifests={manifests}
            fetchManifestForUser={fetchManifestForUser}
          />
        </Drawer>
      )}

      <Box
        sx={{
          flexGrow: 1,
          padding: 2,
          transition: 'margin 0.3s ease',
          marginRight: openMedia || openManifest ? '400px' : '0px',
        }}
      >
        {children}
      </Box>
    </>
  );
};
