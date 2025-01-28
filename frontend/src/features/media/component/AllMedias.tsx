import {
  Box,
  Divider,
  Grid,
  IconButton,
  styled,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ChangeEvent,
  Dispatch,
  ReactNode,
  SetStateAction,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createMedia } from "../api/createMedia.ts";
import { User } from "../../auth/types/types.ts";
import {
  LinkUserGroup,
  UserGroup,
  UserGroupTypes,
} from "../../user-group/types/types.ts";
import { Media, MediaGroupRights, MediaTypes } from "../types/types.ts";
import toast from "react-hot-toast";
import { deleteMedia } from "../api/deleteMedia.ts";
import { updateMedia } from "../api/updateMedia.ts";
import { lookingForMedias } from "../api/lookingForMedias.ts";
import { SearchBar } from "../../../components/elements/SearchBar.tsx";
import { lookingForUserGroups } from "../../user-group/api/lookingForUserGroups.ts";
import { addMediaToGroup } from "../api/AddMediaToGroup.ts";
import { ListItem } from "../../../components/types.ts";
import { ProjectGroup } from "../../projects/types/types.ts";
import { removeAccessToMedia } from "../api/removeAccessToMedia.ts";
import { getAllMediaGroups } from "../api/getAllMediaGroups.ts";
import { updateAccessToMedia } from "../api/updateAccessToMedia.ts";
import SpeedDialTooltipOpen from "../../../components/elements/SpeedDial.tsx";
import AddLinkIcon from "@mui/icons-material/AddLink";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { DrawerLinkMedia } from "./DrawerLinkMedia.tsx";
import { createMediaLink } from "../api/createMediaWithLink.ts";
import { PaginationControls } from "../../../components/elements/Pagination.tsx";
import { CustomTabPanel } from "../../../components/elements/CustomTabPanel.tsx";
import { a11yProps } from "../../../components/elements/SideBar/allyProps.tsx";
import { MediaCard } from "./MediaCard.tsx";
import { useTranslation } from "react-i18next";
import { SortItemSelector } from "../../../components/elements/sortItemSelector.tsx";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { removeMediaFromList } from "../api/removeManifestFromList.ts";

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

interface IAllMediasProps {
  user: User;
  userPersonalGroup: UserGroup;
  medias: Media[];
  fetchMediaForUser: () => void;
  setMedias: Dispatch<SetStateAction<Media[]>>;
}

const caddyUrl = import.meta.env.VITE_CADDY_URL;

export const AllMedias = ({
  user,
  userPersonalGroup,
  medias,
  fetchMediaForUser,
  setMedias,
}: IAllMediasProps) => {
  const [openModalMediaId, setOpenModalMediaId] = useState<number | null>(null);
  const [searchedMedia, setSearchedMedia] = useState<Media | null>(null);
  const [userGroupsSearch, setUserGroupSearch] = useState<LinkUserGroup[]>([]);
  const [userToAdd, setUserToAdd] = useState<LinkUserGroup | null>(null);
  const [groupList, setGroupList] = useState<ProjectGroup[]>([]);
  const [mediaFiltered, setMediaFiltered] = useState<Media[] | undefined>([]);
  const [modalLinkMediaIsOpen, setModalLinkMediaIsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [sortField, setSortField] = useState<keyof Media>("title");
  const [sortOrder, setSortOrder] = useState("asc");

  const { t } = useTranslation();

  useEffect(() => {
    fetchMediaForUser();
  }, []);

  const handleChangeTab = (_event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const currentPageData = useMemo(() => {
    const filteredAndSortedItems = [...medias]
      .filter((media) => {
        if (tabValue === 1) {
          return media.mediaTypes === MediaTypes.VIDEO;
        } else if (tabValue === 2) {
          return media.mediaTypes === MediaTypes.IMAGE;
        }
        return true;
      })
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        let comparison = 0;

        if (sortField === "created_at") {
          const aDate = new Date(aValue as string);
          const bDate = new Date(bValue as string);

          if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
            comparison = aDate.getTime() - bDate.getTime();
          }
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
    // Paginate the filtered and sorted items
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedItems.slice(start, end);
  }, [currentPage, medias, sortField, sortOrder, tabValue]);

  const totalPages = Math.ceil(
    medias.filter((media) => {
      if (tabValue === 1) {
        return media.mediaTypes === MediaTypes.VIDEO;
      } else if (tabValue === 2) {
        return media.mediaTypes === MediaTypes.IMAGE;
      }
      return true;
    }).length / itemsPerPage,
  );
  const handleCreateMedia = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        const maxUploadSize =
          import.meta.env.VITE_MAX_UPLOAD_SIZE * 1024 * 1024;
        if (event.target.files[0].size > maxUploadSize) {
          toast.error(
            t("fileTooLarge", {
              maxSize: import.meta.env.VITE_MAX_UPLOAD_SIZE,
            }),
          );
        } else {
          await createMedia({
            idCreator: user.id,
            user_group: userPersonalGroup!,
            file: event.target.files[0],
          });
          fetchMediaForUser();
        }
      }
    },
    [fetchMediaForUser, medias],
  );

  const HandleCopyToClipBoard = async (path: string) => {
    await navigator.clipboard.writeText(path);
    toast.success(t("successCopy"));
  };

  const HandleOpenModal = useCallback(
    (mediaId: number) => {
      setOpenModalMediaId(openModalMediaId === mediaId ? null : mediaId);
    },
    [setOpenModalMediaId, openModalMediaId],
  );

  const HandleDeleteMedia = useCallback(
    async (mediaId: number) => {
      await deleteMedia(mediaId);
      const updatedListOfMedias = medias.filter(function (media) {
        return media.id != mediaId;
      });
      setMedias(updatedListOfMedias);
    },
    [medias, setMedias],
  );

  const HandleUpdateMedia = useCallback(
    async (mediaToUpdate: Media) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { share, ...mediaDto } = mediaToUpdate;
      await updateMedia(mediaDto);
      const updatedListOfMedias = medias.filter(function (media) {
        return media.id != mediaToUpdate.id;
      });
      updatedListOfMedias.push(mediaToUpdate);
      setMedias(updatedListOfMedias);
      fetchMediaForUser();
    },
    [medias, setMedias],
  );

  const HandleLookingForMedia = async (partialString: string) => {
    const mediaFiltered = await lookingForMedias(
      partialString,
      userPersonalGroup.id,
    );
    return mediaFiltered;
  };

  const getOptionLabelForMediaSearchBar = (option: Media): string => {
    return option.title;
  };

  const handleSetSearchMedia = (mediaQuery: Media) => {
    if (mediaQuery) {
      const searchedMedia = medias.find((media) => media.id === mediaQuery.id);
      setSearchedMedia(searchedMedia!);
    } else {
      setSearchedMedia(null);
    }
  };

  const handleGrantAccess = async (mediaId: number) => {
    if (userToAdd == null) {
      toast.error(t("toastSelectItem"));
    }
    const linkUserGroupToAdd = userGroupsSearch.find(
      (linkUserGroup) => linkUserGroup.user_group.id === userToAdd!.id,
    );
    await addMediaToGroup(mediaId, linkUserGroupToAdd!.user_group.id);
  };

  const getOptionLabel = (option: UserGroup): string => {
    return option.title;
  };
  const listOfGroup: ListItem[] = useMemo(() => {
    return groupList.map((projectGroup) => ({
      id: projectGroup.user_group.id,
      title: projectGroup.user_group.title,
      rights: projectGroup.rights,
      type: projectGroup.user_group.type,
    }));
  }, [groupList]);

  const handleLookingForUserGroups = async (
    partialString: string,
  ): Promise<UserGroup[]> => {
    if (partialString.length > 0) {
      const linkUserGroups: LinkUserGroup[] =
        await lookingForUserGroups(partialString);
      const uniqueUserGroups: UserGroup[] = linkUserGroups
        .map((linkUserGroup) => linkUserGroup.user_group)
        .filter(
          (group, index, self) =>
            index === self.findIndex((g) => g.id === group.id),
        );
      setUserGroupSearch(linkUserGroups);
      return uniqueUserGroups;
    } else {
      setUserGroupSearch([]);
      return [];
    }
  };

  const handleRemoveAccessToMedia = async (
    userGroupId: number,
    mediaId: number,
  ) => {
    await removeAccessToMedia(mediaId, userGroupId);
  };
  const handleChangeRights = async (
    group: ListItem,
    eventValue: string,
    mediaId: number,
  ) => {
    await updateAccessToMedia(
      mediaId,
      group.id,
      eventValue as MediaGroupRights,
    );
  };

  const handleButtonClick = () => {
    document.getElementById("file-upload")!.click();
  };

  const handleFiltered = (partialString: string) => {
    if (partialString.length < 1) {
      return setMediaFiltered([]);
    }
    const mediaFiltered = medias.filter((media) =>
      media.title.toLowerCase().includes(partialString.toLowerCase()),
    );
    setMediaFiltered(mediaFiltered.length > 0 ? mediaFiltered : undefined);
  };

  const actions = [
    {
      icon: (<AddLinkIcon />) as ReactNode,
      name: t("actionsDial.link"),
      onClick: () => {
        setModalLinkMediaIsOpen(!modalLinkMediaIsOpen);
      },
    },
    {
      icon: (<UploadFileIcon />) as ReactNode,
      name: t("actionsDial.upload"),
      onClick: () => {
        handleButtonClick();
      },
    },
  ];
  const createMediaWithLink = async (link: string) => {
    try {
      const mediaLinked = await createMediaLink({
        url: link,
        idCreator: user.id,
        user_group: userPersonalGroup,
      });
      fetchMediaForUser();
      HandleOpenModal(mediaLinked.id);
    } catch (error) {
      console.error("Error fetching the image:", error);
    }
  };

  const getGroupByOption = (option: UserGroup): string => {
    if (option.type === UserGroupTypes.MULTI_USER) {
      return "Groups";
    } else {
      return "Users";
    }
  };

  const handleRemoveMediaFromList = async (
    mediaId: number,
    share: string | undefined,
  ) => {
    if (share) {
      return toast.error(t("share-media-error-message"));
    } else {
      await removeMediaFromList(mediaId);
      toast.success(t("removedMediaFromList"));
      return fetchMediaForUser();
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Grid item container flexDirection="column" spacing={1}>
        <Grid
          container
          alignItems="center"
          justifyContent="space-between"
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            backgroundColor: "#dcdcdc",
            paddingBottom: "10px",
          }}
        >
          <Grid item>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={tabValue}
                onChange={handleChangeTab}
                aria-label="basic tabs"
              >
                <Tab label={t("All")} {...a11yProps(0)} />
                <Tab label={t("Videos")} {...a11yProps(1)} />
                <Tab label={t("Images")} {...a11yProps(2)} />
              </Tabs>
            </Box>
          </Grid>
          <Grid item>
            <VisuallyHiddenInput
              id="file-upload"
              type="file"
              onChange={handleCreateMedia}
            />
          </Grid>
          <Grid
            item
            container
            spacing={2}
            sx={{ width: "auto", paddingTop: 1, paddingBottom: 1 }}
            alignItems="center"
            justifyContent="flex-end"
          >
            <Grid item>
              <SortItemSelector<Media>
                sortField={sortField}
                setSortField={setSortField}
                fields={["title", "created_at"]}
              />
            </Grid>
            <Grid item>
              <Tooltip title={t(sortOrder === "asc" ? "sortAsc" : "sortDesc")}>
                <IconButton onClick={toggleSortOrder}>
                  {sortOrder === "asc" ? (
                    <ArrowDropUpIcon />
                  ) : (
                    <ArrowDropDownIcon />
                  )}
                </IconButton>
              </Tooltip>
            </Grid>
            <Divider orientation="vertical" variant="middle" flexItem />
            <Grid item>
              <SearchBar
                handleFiltered={handleFiltered}
                setFilter={setMediaFiltered}
                fetchFunction={HandleLookingForMedia}
                getOptionLabel={getOptionLabelForMediaSearchBar}
                label={t("filterMedia")}
                setSearchedData={handleSetSearchMedia}
              />
            </Grid>
          </Grid>
        </Grid>
        {!medias.length && (
          <Grid container justifyContent={"center"}>
            <Typography variant="h6" component="h2">
              {t("noMediaYet")}
            </Typography>
          </Grid>
        )}
        {!searchedMedia && mediaFiltered && mediaFiltered.length < 1 && (
          <Grid
            item
            container
            spacing={1}
            flexDirection="column"
            sx={{ marginBottom: "70px" }}
          >
            <CustomTabPanel value={tabValue} index={0}>
              <Grid container spacing={2} direction="column">
                {currentPageData.map((media) => (
                  <Grid item key={media.id}>
                    <MediaCard
                      media={media}
                      getAllMediaGroups={getAllMediaGroups}
                      getOptionLabel={getOptionLabel}
                      getGroupByOption={getGroupByOption}
                      HandleOpenModal={HandleOpenModal}
                      HandleDeleteMedia={HandleDeleteMedia}
                      handleGrantAccess={handleGrantAccess}
                      HandleCopyToClipBoard={HandleCopyToClipBoard}
                      HandleUpdateMedia={HandleUpdateMedia}
                      caddyUrl={caddyUrl}
                      handleChangeRights={handleChangeRights}
                      handleLookingForUserGroups={handleLookingForUserGroups}
                      handleRemoveAccessToMedia={handleRemoveAccessToMedia}
                      openModalMediaId={openModalMediaId}
                      listOfGroup={listOfGroup}
                      setGroupList={setGroupList}
                      setUserToAdd={setUserToAdd}
                      handleRemoveMediaFromList={handleRemoveMediaFromList}
                    />
                  </Grid>
                ))}
              </Grid>
            </CustomTabPanel>
            <CustomTabPanel value={tabValue} index={1}>
              <Grid container spacing={2} direction="column">
                {currentPageData.map((media) => (
                  <Grid item key={media.id}>
                    <MediaCard
                      key={media.id}
                      media={media}
                      getAllMediaGroups={getAllMediaGroups}
                      getOptionLabel={getOptionLabel}
                      getGroupByOption={getGroupByOption}
                      HandleOpenModal={HandleOpenModal}
                      HandleDeleteMedia={HandleDeleteMedia}
                      handleGrantAccess={handleGrantAccess}
                      HandleCopyToClipBoard={HandleCopyToClipBoard}
                      HandleUpdateMedia={HandleUpdateMedia}
                      caddyUrl={caddyUrl}
                      handleChangeRights={handleChangeRights}
                      handleLookingForUserGroups={handleLookingForUserGroups}
                      handleRemoveAccessToMedia={handleRemoveAccessToMedia}
                      openModalMediaId={openModalMediaId}
                      listOfGroup={listOfGroup}
                      setGroupList={setGroupList}
                      setUserToAdd={setUserToAdd}
                      handleRemoveMediaFromList={handleRemoveMediaFromList}
                    />
                  </Grid>
                ))}
              </Grid>
            </CustomTabPanel>
            <CustomTabPanel value={tabValue} index={2}>
              <Grid container spacing={2} direction="column">
                {currentPageData.map((media) => (
                  <Grid item key={media.id}>
                    <MediaCard
                      key={media.id}
                      media={media}
                      getAllMediaGroups={getAllMediaGroups}
                      getOptionLabel={getOptionLabel}
                      getGroupByOption={getGroupByOption}
                      HandleOpenModal={HandleOpenModal}
                      HandleDeleteMedia={HandleDeleteMedia}
                      handleGrantAccess={handleGrantAccess}
                      HandleCopyToClipBoard={HandleCopyToClipBoard}
                      HandleUpdateMedia={HandleUpdateMedia}
                      caddyUrl={caddyUrl}
                      handleChangeRights={handleChangeRights}
                      handleLookingForUserGroups={handleLookingForUserGroups}
                      handleRemoveAccessToMedia={handleRemoveAccessToMedia}
                      openModalMediaId={openModalMediaId}
                      listOfGroup={listOfGroup}
                      setGroupList={setGroupList}
                      setUserToAdd={setUserToAdd}
                      handleRemoveMediaFromList={handleRemoveMediaFromList}
                    />
                  </Grid>
                ))}
              </Grid>
            </CustomTabPanel>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Grid>
        )}
        {searchedMedia && (
          <Grid
            item
            container
            spacing={1}
            flexDirection="column"
            sx={{ marginBottom: "70px" }}
          >
            {
              <Grid item key={searchedMedia.id}>
                <MediaCard
                  key={searchedMedia.id}
                  media={searchedMedia}
                  getAllMediaGroups={getAllMediaGroups}
                  getOptionLabel={getOptionLabel}
                  getGroupByOption={getGroupByOption}
                  HandleOpenModal={HandleOpenModal}
                  HandleDeleteMedia={HandleDeleteMedia}
                  handleGrantAccess={handleGrantAccess}
                  HandleCopyToClipBoard={HandleCopyToClipBoard}
                  HandleUpdateMedia={HandleUpdateMedia}
                  caddyUrl={caddyUrl}
                  handleChangeRights={handleChangeRights}
                  handleLookingForUserGroups={handleLookingForUserGroups}
                  handleRemoveAccessToMedia={handleRemoveAccessToMedia}
                  openModalMediaId={openModalMediaId}
                  listOfGroup={listOfGroup}
                  setGroupList={setGroupList}
                  setUserToAdd={setUserToAdd}
                  handleRemoveMediaFromList={handleRemoveMediaFromList}
                />
              </Grid>
            }
          </Grid>
        )}
        {!searchedMedia && mediaFiltered && mediaFiltered.length > 0 && (
          <Grid
            item
            container
            spacing={1}
            flexDirection="column"
            sx={{ marginBottom: "70px" }}
          >
            {mediaFiltered.map((media) => (
              <Grid item key={media.id}>
                <MediaCard
                  key={media.id}
                  media={media}
                  getAllMediaGroups={getAllMediaGroups}
                  getOptionLabel={getOptionLabel}
                  getGroupByOption={getGroupByOption}
                  HandleOpenModal={HandleOpenModal}
                  HandleDeleteMedia={HandleDeleteMedia}
                  handleGrantAccess={handleGrantAccess}
                  HandleCopyToClipBoard={HandleCopyToClipBoard}
                  HandleUpdateMedia={HandleUpdateMedia}
                  caddyUrl={caddyUrl}
                  handleChangeRights={handleChangeRights}
                  handleLookingForUserGroups={handleLookingForUserGroups}
                  handleRemoveAccessToMedia={handleRemoveAccessToMedia}
                  openModalMediaId={openModalMediaId}
                  listOfGroup={listOfGroup}
                  setGroupList={setGroupList}
                  setUserToAdd={setUserToAdd}
                  handleRemoveMediaFromList={handleRemoveMediaFromList}
                />
              </Grid>
            ))}
          </Grid>
        )}
        {!mediaFiltered && (
          <Grid item container justifyContent="center" alignItems="center">
            <Typography variant="h6" component="h2">
              {t("noMatchingMediaFilter")}
            </Typography>
          </Grid>
        )}
        <Grid>
          <DrawerLinkMedia
            toggleModalMediaCreation={() =>
              setModalLinkMediaIsOpen(!modalLinkMediaIsOpen)
            }
            CreateMediaWithLink={createMediaWithLink}
            modalCreateMediaIsOpen={modalLinkMediaIsOpen}
          />
        </Grid>
        <Grid
          item
          sx={{ position: "fixed", right: "10px", bottom: "3px", zIndex: 999 }}
        >
          <SpeedDialTooltipOpen actions={actions} />
        </Grid>
      </Grid>
      <Grid item width={"100%"} height={"100%"}>
        <iframe
          src="./../../customAssets/media-footer.html"
          title="Media footer information"
          style={{ border: "none" }}
        ></iframe>
      </Grid>
    </Box>
  );
};
