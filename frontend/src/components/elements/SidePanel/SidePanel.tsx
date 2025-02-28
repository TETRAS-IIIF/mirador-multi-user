import {
  Box,
  Drawer,
  Grid,
  IconButton,
  ImageList,
  ImageListItem,
  styled,
} from "@mui/material";
import { ReactNode, useEffect, useState } from "react";
import { SearchBar } from "../../../components/elements/SearchBar.tsx";
import { CloseButton } from "../../../components/elements/SideBar/CloseButton.tsx";
import { OpenButton } from "../../../components/elements/SideBar/OpenButton.tsx";
import { useTranslation } from "react-i18next";
import { useCurrentPageData } from "../../../utils/customHooks/filterHook.ts";
import { UserGroup } from "../../../features/user-group/types/types.ts";
import { User } from "../../../features/auth/types/types.ts";
import { Media } from "../../../features/media/types/types.ts";
import { Manifest } from "../../../features/manifest/types/types.ts";
import { ContentSidePanelMedia } from "../../../features/media/component/ContentSidePanelMedia.tsx";

const ToggleMediaButton = styled(IconButton)<{ open: boolean }>(({ open }) => ({
  position: "fixed",
  top: "80px",
  right: open ? 460 : -50,
  zIndex: 9999,
  transition: "right 0.3s ease",
  "&:hover": {
    backgroundColor: "transparent",
  },
}));

const ToggleManifestButton = styled(IconButton)<{ open: boolean }>(
  ({ open }) => ({
    position: "fixed",
    top: "200px",
    right: open ? 460 : -70,
    zIndex: 9999,
    transition: "right 0.3s ease",
    "&:hover": {
      backgroundColor: "transparent",
    },
  }),
);

interface SidePanelProps {
  medias: Media[];
  manifest: Manifest[];
  children: ReactNode;
  userPersonalGroup: UserGroup;
  user: User;
  fetchMediaForUser: () => void;
  fetchManifestForUser: () => void;
  display: boolean;
}

export const SidePanel = ({
  medias,
  manifest,
  children,
  fetchMediaForUser,
  fetchManifestForUser,
  display,
  user,
  userPersonalGroup,
}: SidePanelProps) => {
  const [openMedia, setOpenMedia] = useState(false);
  const [openManifest, setOpenManifest] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const { t } = useTranslation();
  const itemsPerPage = 9;

  useEffect(() => {
    if (openMedia) fetchMediaForUser();
    if (openManifest) fetchManifestForUser();
  }, [openMedia, openManifest]);

  const mediaPageData = useCurrentPageData({
    currentPage: 1,
    sortField: "title",
    sortOrder: "asc",
    items: medias,
    itemsPerPage,
    filter,
  });

  const manifestPageData = useCurrentPageData({
    currentPage: 1,
    sortField: "title",
    sortOrder: "asc",
    items: manifest,
    itemsPerPage,
    filter,
  });

  const handleSetOpenMedia = () => {
    setOpenMedia(!openMedia);
    setOpenManifest(false);
  };

  const handleSetOpenManifest = () => {
    setOpenManifest(!openManifest);
    setOpenMedia(false);
  };

  const handleButtonClick = () => {
    document.getElementById("file-upload")!.click();
  };

  return (
    <Grid container>
      {display && (
        <>
          <ToggleMediaButton open={openMedia} onClick={handleSetOpenMedia}>
            {openMedia ? (
              <CloseButton text={t("Media")} />
            ) : (
              <OpenButton text={t("Media")} />
            )}
          </ToggleMediaButton>
          <ToggleManifestButton
            open={openManifest}
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
        <Drawer open={openManifest} anchor="right" variant="persistent">
          <Grid
            container
            spacing={1}
            sx={{ padding: "20px" }}
            alignItems="center"
          >
            <Grid item>
              <SearchBar label={t("search")} setFilter={setFilter} />
            </Grid>
          </Grid>
          <ImageList
            sx={{ minWidth: 500, padding: 1, width: 500 }}
            cols={3}
            rowHeight={164}
          >
            {manifestPageData.map((item) => (
              <ImageListItem key={item.id}>
                <img
                  src={item.thumbnailUrl || "placeholder.png"}
                  alt={item.title}
                />
              </ImageListItem>
            ))}
          </ImageList>
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
