import {
  Box,
  Button,
  Drawer,
  Grid,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  styled,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ChangeEvent,
  ReactNode,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import { Media, MediaTypes } from "../types/types.ts";
import { SearchBar } from "../../../components/elements/SearchBar.tsx";
import { UserGroup } from "../../user-group/types/types.ts";
import { createMedia } from "../api/createMedia.ts";
import { User } from "../../auth/types/types.ts";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AddLinkIcon from "@mui/icons-material/AddLink";
import { DrawerLinkMedia } from "./DrawerLinkMedia.tsx";
import { createMediaLink } from "../api/createMediaWithLink.ts";
import { PaginationControls } from "../../../components/elements/Pagination.tsx";
import { CloseButton } from "../../../components/elements/SideBar/CloseButton.tsx";
import { OpenButton } from "../../../components/elements/SideBar/OpenButton.tsx";
import { a11yProps } from "../../../components/elements/SideBar/allyProps.tsx";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import ImageIcon from "@mui/icons-material/Image";
import { useTranslation } from "react-i18next";

const CustomImageItem = styled(ImageListItem)({
  position: "relative",
  "&:hover img": {
    opacity: 0.4,
  },
  "&:hover .overlayButton": {
    opacity: 1,
  },
});

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const CustomButton = styled(Button)({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  textAlign: "center",
  opacity: 0,
  transition: "opacity 0.3s ease",
});

const ToggleButton = styled(IconButton)(({ open }: { open: boolean }) => ({
  position: "fixed",
  top: 80,
  right: open ? 450 : -50,
  zIndex: 9999,
  transition: "right 0.3s ease",
  "&:hover": {
    backgroundColor: "transparent",
  },
}));

interface PopUpMediaProps {
  medias: Media[];
  children: ReactNode;
  userPersonalGroup: UserGroup;
  user: User;
  fetchMediaForUser: () => void;
  display: boolean;
  open: boolean;
  setOpen: () => void;
}

const caddyUrl = import.meta.env.VITE_CADDY_URL;

const MEDIA_TYPES_TABS = {
  ALL: 0,
  VIDEO: 1,
  IMAGE: 2,
};

export const SidePanelMedia = ({
  display,
  medias,
  children,
  userPersonalGroup,
  user,
  fetchMediaForUser,
  open,
  setOpen,
}: PopUpMediaProps) => {
  const [modalLinkMediaIsOpen, setModalLinkMediaIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mediaTabShown, setMediaTabShown] = useState(MEDIA_TYPES_TABS.ALL);
  const [mediaFilter, setMediaFilter] = useState<string | null>(null);

  const itemsPerPage = 9;

  const { t } = useTranslation();

  const handleCopyToClipBoard = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      toast.success(t("pathCopiedToClipboard"));
    } catch (error) {
      toast.error(t("pathNotCopiedToClipboard"));
    }
  };

  const isInFilter = (media: Media) => {
    if (mediaFilter) {
      return media.title.toLowerCase().includes(mediaFilter.toLowerCase());
    } else {
      return true;
    }
  };

  useEffect(() => {
    fetchMediaForUser();
  }, []);

  const currentPageData = useMemo(() => {
    const filteredAndSortedItems = [...medias]
      .filter((media) => {
        if (mediaTabShown === MEDIA_TYPES_TABS.VIDEO) {
          return media.mediaTypes === MediaTypes.VIDEO;
        } else if (mediaTabShown === MEDIA_TYPES_TABS.IMAGE) {
          return media.mediaTypes === MediaTypes.IMAGE;
        }
        return true;
      })
      .filter((media) => isInFilter(media));
    // Paginate the filtered and sorted items
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedItems.slice(start, end);
  }, [currentPage, medias, mediaTabShown, mediaFilter]);

  const totalPages = Math.ceil(medias.length / itemsPerPage);

  const toggleDrawer = () => {
    setOpen();
  };

  const handleChangeTab = (_event: SyntheticEvent, newValue: number) => {
    setMediaTabShown(newValue);
    setCurrentPage(1);
  };

  const handleCreateMedia = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        await createMedia(
          {
            idCreator: user.id,
            user_group: userPersonalGroup!,
            file: event.target.files[0],
          },
          t,
        );
        fetchMediaForUser();
      }
    },
    [fetchMediaForUser, user.id, userPersonalGroup, medias],
  );

  const createMediaWithLink = async (link: string) => {
    try {
      await createMediaLink({
        url: link,
        idCreator: user.id,
        user_group: userPersonalGroup,
      });
      fetchMediaForUser();
    } catch (error) {
      console.error("Error fetching the image:", error);
    }
  };

  const handleButtonClick = () => {
    document.getElementById("file-upload")!.click();
  };

  return (
    <Grid container>
      {display && (
        <ToggleButton open={open} onClick={toggleDrawer}>
          {open ? <CloseButton text="Medias" /> : <OpenButton text="Medias" />}
        </ToggleButton>
      )}
      {display && (
        <Drawer
          open={open}
          anchor="right"
          variant="persistent"
          sx={{ position: "relative", zIndex: 9998 }}
          ModalProps={{
            BackdropProps: {
              style: { backgroundColor: "transparent" },
            },
          }}
        >
          <Grid
            item
            container
            spacing={1}
            sx={{ padding: "20px", width: "510px" }}
            alignItems="center"
          >
            <Grid item>
              <SearchBar label={t("search")} setFilter={setMediaFilter} />
            </Grid>
            <Grid item>
              <Tooltip title="Upload Media">
                <Button onClick={handleButtonClick} variant="contained">
                  {" "}
                  <UploadFileIcon />
                </Button>
              </Tooltip>
            </Grid>
            <Grid item>
              <Tooltip title="Link Media">
                <Button
                  variant="contained"
                  onClick={() => setModalLinkMediaIsOpen(!modalLinkMediaIsOpen)}
                >
                  <AddLinkIcon />
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
          <Tabs
            value={mediaTabShown}
            onChange={handleChangeTab}
            aria-label="basic tabs example"
          >
            <Tab label="All" {...a11yProps(0)} />
            <Tab label="Videos" {...a11yProps(1)} />
            <Tab label="Images" {...a11yProps(2)} />
          </Tabs>

          {currentPageData.length > 0 ? (
            <ImageList
              sx={{ minWidth: 500, padding: 1, width: 500 }}
              cols={3}
              rowHeight={164}
            >
              {currentPageData.map((media) => (
                <CustomImageItem
                  key={media.hash}
                  sx={{ position: "relative", width: 150, height: 150 }}
                >
                  <Box
                    component="img"
                    src={`${caddyUrl}/${media.hash}/thumbnail.webp`}
                    alt={media.title}
                    loading="lazy"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      "@media(min-resolution: 2dppx)": {
                        width: "100%",
                        height: "100%",
                      },
                    }}
                  />
                  <ImageListItemBar
                    title={media.title}
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      color: "white",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: "white",
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {media.mediaTypes === MediaTypes.VIDEO ? (
                      <OndemandVideoIcon />
                    ) : (
                      <ImageIcon />
                    )}
                  </Box>
                  <CustomButton
                    className="overlayButton"
                    disableRipple
                    onClick={
                      media.path
                        ? () =>
                            handleCopyToClipBoard(
                              `${caddyUrl}/${media.hash}/${media.path}`,
                            )
                        : () => handleCopyToClipBoard(`${media.url}`)
                    }
                  >
                    Copy path to clipboard
                  </CustomButton>
                </CustomImageItem>
              ))}
            </ImageList>
          ) : (
            <Grid item container justifyContent="center" alignItems="center">
              <Typography variant="h6" component="h2">
                {t("noMatchingMediaFilter")}
              </Typography>
            </Grid>
          )}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          <Grid item>
            <VisuallyHiddenInput
              id="file-upload"
              type="file"
              onChange={handleCreateMedia}
            />
          </Grid>
        </Drawer>
      )}

      <Box
        sx={{
          flexGrow: 1,
          padding: 2,
          transition: "margin 0.3s ease",
          marginRight: open ? "500px" : "0px",
        }}
      >
        {children}
      </Box>
      <Grid>
        <DrawerLinkMedia
          toggleModalMediaCreation={() =>
            setModalLinkMediaIsOpen(!modalLinkMediaIsOpen)
          }
          CreateMediaWithLink={createMediaWithLink}
          modalCreateMediaIsOpen={modalLinkMediaIsOpen}
        />
      </Grid>
    </Grid>
  );
};
