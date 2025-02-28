import { Box, Drawer, Grid, IconButton, styled } from "@mui/material";
import { ReactNode, useState } from "react";
import { CloseButton } from "../SideBar/CloseButton.tsx";
import { OpenButton } from "../SideBar/OpenButton.tsx";
import { useTranslation } from "react-i18next";
import { UserGroup } from "../../../features/user-group/types/types.ts";
import { User } from "../../../features/auth/types/types.ts";
import { Media } from "../../../features/media/types/types.ts";
import { Manifest } from "../../../features/manifest/types/types.ts";
import { ContentSidePanelMedia } from "../../../features/media/component/ContentSidePanelMedia.tsx";
import { ContentSidePanelManifest } from "../../../features/manifest/component/ContentSidePanelManifest.tsx";

const ToggleMediaButton = styled(IconButton)<{ open: boolean; shift: boolean }>(
  ({ open, shift }) => ({
    position: "fixed",
    top: "130px",
    right: open ? 360 : shift ? 360 : -50,
    zIndex: 9999,
    transition: "right 0.3s ease",
    "&:hover": {
      backgroundColor: "transparent",
    },
  }),
);

const ToggleButton = styled(IconButton)<{ open: boolean }>(({ open }) => ({
  position: "fixed",
  top: "40px",
  right: open ? 400 : 0,
  zIndex: 9999,
  transition: "right 0.3s ease",
  "&:hover": {
    backgroundColor: "transparent",
  },
}));

const ToggleManifestButton = styled(IconButton)<{
  open: boolean;
  shift: boolean;
}>(({ open, shift }) => ({
  position: "fixed",
  top: "250px",
  right: open ? 335 : shift ? 335 : -70,
  zIndex: 9999,
  transition: "right 0.3s ease",
  "&:hover": {
    backgroundColor: "transparent",
  },
}));

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

  return (
    <Grid container>
      {display && (
        <>
          <ToggleButton
            open={openMedia || openManifest}
            onClick={handleSetOpenMedia}
          >
            {openMedia || openManifest ? (
              <CloseButton text={t("")} />
            ) : (
              <OpenButton text={t("")} />
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
                  <CloseButton text={t("Media")} />
                ) : (
                  <OpenButton text={t("Media")} />
                )}
              </ToggleMediaButton>
              <ToggleManifestButton
                open={openManifest}
                shift={openMedia}
                onClick={handleSetOpenManifest}
              >
                {openManifest ? (
                  <CloseButton text={t("Manifests")} />
                ) : (
                  <OpenButton text={t("Manifests")} />
                )}
              </ToggleManifestButton>
            </>
          )}
        </>
      )}
      {openMedia && (
        <Drawer
          open={openMedia}
          anchor="right"
          variant="persistent"
          sx={{ position: "relative", zIndex: 9999 }}
          ModalProps={{
            BackdropProps: {
              style: { backgroundColor: "transparent" },
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
      {openManifest && (
        <Drawer
          open={openManifest}
          anchor="right"
          variant="persistent"
          sx={{ position: "relative", zIndex: 9999 }}
          ModalProps={{
            BackdropProps: {
              style: { backgroundColor: "transparent" },
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
          transition: "margin 0.3s ease",
          marginRight: openMedia || openManifest ? "500px" : "0px",
        }}
      >
        {children}
      </Box>
    </Grid>
  );
};
