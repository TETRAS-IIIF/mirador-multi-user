import {
  Divider,
  Grid,
  IconButton,
  styled,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ChangeEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LinkUserGroup,
  UserGroup,
  UserGroupTypes,
} from "../../user-group/types/types.ts";
import { User } from "../../auth/types/types.ts";
import {
  Manifest,
  ManifestCanvases,
  ManifestGroupRights,
  manifestOrigin,
} from "../types/types.ts";
import { uploadManifest } from "../api/uploadManifest.ts";
import MMUCard from "../../../components/elements/MMUCard.tsx";
import { SearchBar } from "../../../components/elements/SearchBar.tsx";
import { lookingForManifests } from "../api/loonkingForManifests.ts";
import { ModalButton } from "../../../components/elements/ModalButton.tsx";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import toast from "react-hot-toast";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import CreateIcon from "@mui/icons-material/Create";
import { ManifestCreationForm } from "./ManifestCreationForm.tsx";
import { SidePanelMedia } from "../../media/component/SidePanelMedia.tsx";
import { Media } from "../../media/types/types.ts";
import SpeedDialTooltipOpen from "../../../components/elements/SpeedDial.tsx";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AddLinkIcon from "@mui/icons-material/AddLink";
import { DrawerLinkManifest } from "./DrawerLinkManifest.tsx";
import { linkManifest } from "../api/linkManifest.ts";
import { createManifest } from "../api/createManifest.ts";
import { PaginationControls } from "../../../components/elements/Pagination.tsx";
import { updateManifest } from "../api/updateManifest.ts";
import { deleteManifest } from "../api/deleteManifest.ts";
import { lookingForUserGroups } from "../../user-group/api/lookingForUserGroups.ts";
import { ProjectGroup } from "../../projects/types/types.ts";
import { grantAccessToManifest } from "../api/grantAccessToManifest.ts";
import { getAllManifestGroups } from "../api/getAllManifestGroups.ts";
import { ListItem } from "../../../components/types.ts";
import { updateAccessToManifest } from "../api/updateAccessToManifest.ts";
import { ObjectTypes } from "../../tag/type.ts";
import { useTranslation } from "react-i18next";
import { SortItemSelector } from "../../../components/elements/sortItemSelector.tsx";
import placeholder from "../../../assets/Placeholder.svg";
import { IIIFResource, ManifestResource } from "manifesto.js";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { removeManifestFromList } from "../api/removeManifestFromList.ts";

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

interface IAllManifests {
  userPersonalGroup: UserGroup;
  user: User;
  fetchManifestForUser: () => void;
  manifests: Manifest[];
  medias: Media[];
  fetchMediaForUser: () => void;
}

const caddyUrl = import.meta.env.VITE_CADDY_URL;

export const AllManifests = ({
  manifests,
  fetchManifestForUser,
  userPersonalGroup,
  user,
  medias,
  fetchMediaForUser,
}: IAllManifests) => {
  const [createManifestIsOpen, setCreateManifestIsOpen] = useState(false);
  const [searchedManifest, setSearchedManifest] = useState<Manifest | null>(
    null,
  );
  const [openModalManifestId, setOpenModalManifestId] = useState<number | null>(
    null,
  );
  const [searchedManifestIndex, setSearchedManifestIndex] = useState<
    number | null
  >(null);
  const [modalLinkManifestIsOpen, setModalLinkManifestIsOpen] = useState(false);
  const [manifestFiltered, setManifestFiltered] = useState<
    Manifest[] | undefined
  >([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [userGroupSearch, setUserGroupSearch] = useState<LinkUserGroup[]>([]);
  const [userToAdd, setUserToAdd] = useState<LinkUserGroup | null>(null);
  const [groupList, setGroupList] = useState<ProjectGroup[]>([]);
  const [openSidePanel, setOpenSidePanel] = useState(false);
  const [sortField, setSortField] = useState<keyof Manifest>("title");
  const [sortOrder, setSortOrder] = useState("asc");

  const { t } = useTranslation();

  const itemsPerPage = 10;

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  const sortedItems = useMemo(() => {
    return [...manifests].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      let comparison = 0;

      if (sortField === "created_at") {
        const aDate = typeof aValue === "string" ? new Date(aValue) : aValue;
        const bDate = typeof bValue === "string" ? new Date(bValue) : bValue;
        comparison = aDate.getTime() - bDate.getTime();
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [manifests, sortField, sortOrder]);

  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedItems.slice(start, end);
  }, [currentPage, itemsPerPage, sortedItems]);

  const totalPages = Math.ceil(manifests.length / itemsPerPage);

  const handleCreateManifest = useCallback(
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
          await uploadManifest({
            idCreator: user.id,
            file: event.target.files[0],
          });
          fetchManifestForUser();
          setCreateManifestIsOpen(false);
        }
      }
    },
    [fetchManifestForUser, manifests],
  );

  const HandleOpenModal = useCallback(
    (manifestId: number) => {
      setOpenModalManifestId(
        openModalManifestId === manifestId ? null : manifestId,
      );
    },
    [setOpenModalManifestId, openModalManifestId],
  );

  const HandleCreateManifestIsOpen = () => {
    setCreateManifestIsOpen(!createManifestIsOpen);
  };

  const actions = [
    {
      icon: (<CreateIcon />) as ReactNode,
      name: t("actionsDial.create"),
      onClick: HandleCreateManifestIsOpen,
    },
    {
      icon: (<UploadFileIcon />) as ReactNode,
      name: t("actionsDial.upload"),
      onClick: () => {
        document.getElementById("hiddenFileInput")?.click();
      },
    },
    {
      icon: (<AddLinkIcon />) as ReactNode,
      name: t("actionsDial.link"),
      onClick: () => setModalLinkManifestIsOpen(!modalLinkManifestIsOpen),
    },
  ];

  const fetchThumbnails = useCallback(async () => {
    const urls: string[] = await Promise.all(
      currentPageData.map(async (manifest) => {
        if (manifest.thumbnailUrl) {
          return manifest.thumbnailUrl;
        }
        let manifestUrl = "";
        if (manifest.origin === manifestOrigin.UPLOAD) {
          manifestUrl = `${caddyUrl}/${manifest.hash}/${manifest.title}`;
        } else if (manifest.origin === manifestOrigin.LINK) {
          manifestUrl = manifest.path;
        } else if (manifest.origin === manifestOrigin.CREATE) {
          manifestUrl = `${caddyUrl}/${manifest.hash}/${manifest.path}`;
        } else {
          return placeholder;
        }
        try {
          const manifestResponse = await fetch(manifestUrl);
          const manifestFetched = await manifestResponse.json();
          if (manifestFetched.thumbnail) {
            return manifestFetched.thumbnail["@id"];
          } else if (manifestFetched.items[0].thumbnail[0].id) {
            return manifestFetched.items[0].thumbnail[0].id;
          } else {
            return placeholder;
          }
        } catch (error) {
          console.error("Error fetching manifest:", error);
          return placeholder;
        }
      }),
    );

    setThumbnailUrls(urls);
  }, [currentPageData, caddyUrl]);

  useEffect(() => {
    fetchThumbnails();
    fetchManifestForUser();
  }, []);

  const HandleLookingForManifests = async (partialString: string) => {
    const userManifests = await lookingForManifests(
      partialString,
      userPersonalGroup.id,
    );
    return userManifests;
  };

  const getOptionLabelForManifestSearchBar = (option: Manifest): string => {
    return option.title;
  };

  const handleSetSearchManifest = (manifestQuery: Manifest) => {
    if (manifestQuery) {
      const manifestIndex = manifests.findIndex(
        (manifest: Manifest) => manifest.id === manifestQuery.id,
      );
      if (manifestIndex !== -1) {
        setSearchedManifest(manifests[manifestIndex]);
        setSearchedManifestIndex(manifestIndex);
      } else {
        setSearchedManifest(null);
        setSearchedManifestIndex(null);
      }
    } else {
      setSearchedManifest(null);
      setSearchedManifestIndex(null);
    }
  };

  const HandleCopyToClipBoard = async (path: string) => {
    await navigator.clipboard.writeText(path);
    toast.success(t("pathCopiedToClipboard"));
  };

  const handleLinkManifest = useCallback(
    async (path: string) => {
      const response = await fetch(path, {
        method: "GET",
      });
      if (response) {
        const manifest = await response.json();
        const resource = new ManifestResource(manifest, {
          defaultLabel: "mmu-default-label",
          locale: "mmu-default-label",
          resource: manifest as unknown as IIIFResource,
          pessimisticAccessControl: false,
        });
        const manifestLabel = resource.getLabel()[0]._value as string;
        await linkManifest({
          url: path,
          rights: ManifestGroupRights.ADMIN,
          idCreator: user.id,
          path: path,
          title: manifestLabel ? manifestLabel : "new Manifest",
        });
        fetchManifestForUser();
        setModalLinkManifestIsOpen(!modalLinkManifestIsOpen);
        return toast.success(t("manifestCreated"));
      }
      return toast.error(t("manifestCreationFailed"));
    },
    [fetchManifestForUser, modalLinkManifestIsOpen, user.id, userPersonalGroup],
  );

  const handleSubmitManifestCreationForm = async (
    manifestThumbnail: string,
    manifestTitle: string,
    manifestCanvases: ManifestCanvases[],
  ) => {
    try {
      await createManifest({
        manifestMedias: manifestCanvases,
        title: manifestTitle,
        idCreator: user.id,
        manifestThumbnail: manifestThumbnail,
      });
      fetchManifestForUser();
      setCreateManifestIsOpen(false);
    } catch (error) {
      toast.error("Error processing media: " + error);
    }
  };

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

  const handleFiltered = (partialString: string) => {
    if (partialString.length < 1) {
      setManifestFiltered([]);
      return;
    }
    const manifestsFiltered = manifests.filter((manifest) =>
      manifest.title.toLowerCase().includes(partialString.toLowerCase()),
    );
    setManifestFiltered(
      manifestsFiltered.length > 0 ? manifestsFiltered : undefined,
    );
  };

  const handleUpdateManifest = async (manifestToUpdate: Manifest) => {
    try {
      if (manifestToUpdate.origin === manifestOrigin.LINK) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { json, rights, ...manifestDto } = manifestToUpdate;
        await updateManifest(manifestDto);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { rights, ...manifestDto } = manifestToUpdate;
        await updateManifest(manifestDto);
      }
      fetchManifestForUser();
    } catch (error) {
      console.error("Error updating Manifest", error);
    }
  };
  const handleDeleteManifest = async (manifestId: number) => {
    await deleteManifest(manifestId);
    setOpenModalManifestId(null);
    fetchManifestForUser();
  };

  const handleGrantAccess = async (manifestId: number) => {
    if (userToAdd == null) {
      toast.error("select an item in the list");
    }
    const linkUserGroupToAdd = userGroupSearch.find(
      (linkUserGroup) => linkUserGroup.user_group.id === userToAdd!.id,
    );
    await grantAccessToManifest({
      manifestId: manifestId,
      userGroupId: linkUserGroupToAdd!.user_group.id,
    });
  };

  const getOptionLabel = (option: UserGroup): string => {
    return option.title;
  };

  const getGroupByOption = (option: UserGroup): string => {
    if (option.type === UserGroupTypes.MULTI_USER) {
      return "Groups";
    } else {
      return "Users";
    }
  };

  const listOfGroup: ListItem[] = useMemo(() => {
    return groupList.map((projectGroup) => ({
      id: projectGroup.user_group.id,
      title: projectGroup.user_group.title,
      rights: projectGroup.rights,
      type: projectGroup.user_group.type,
    }));
  }, [groupList]);

  const handleChangeRights = async (
    group: ListItem,
    eventValue: string,
    manifestId: number,
  ) => {
    await updateAccessToManifest(
      manifestId,
      group.id,
      eventValue as ManifestGroupRights,
    );
  };
  const handleSetOpenSidePanel = () => {
    setOpenSidePanel(!openSidePanel);
  };

  const handleRemoveManifestFromList: (
    manifestId: number,
    share: string | undefined,
  ) => Promise<void> = async (manifestId, share) => {
    if (share) {
      toast.error(t("share-manifest-error-message"));
      return;
    } else {
      await removeManifestFromList(manifestId);
      toast.success(t("removedManifestFromList"));
      fetchManifestForUser();
    }
  };

  return (
    <>
      <SidePanelMedia
        open={openSidePanel && !!openModalManifestId}
        setOpen={handleSetOpenSidePanel}
        display={!!openModalManifestId}
        fetchMediaForUser={fetchMediaForUser}
        medias={medias}
        user={user}
        userPersonalGroup={userPersonalGroup}
      >
        <Grid
          item
          container
          flexDirection="column"
          spacing={1}
          sx={{ paddingTop: 0 }}
        >
          <Grid
            item
            container
            direction="row-reverse"
            alignItems="center"
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1000,
              backgroundColor: "#dcdcdc",
              paddingBottom: "10px",
              paddingTop: 0,
            }}
          >
            {!createManifestIsOpen && (
              <Grid
                item
                container
                justifyContent="flex-end"
                spacing={2}
                alignItems="center"
              >
                <Grid item>
                  <SortItemSelector<Manifest>
                    sortField={sortField}
                    setSortField={setSortField}
                    fields={["title", "created_at"]}
                  />
                </Grid>
                <Grid item>
                  <Tooltip
                    title={t(sortOrder === "asc" ? "sortAsc" : "sortDesc")}
                  >
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
                    fetchFunction={HandleLookingForManifests}
                    getOptionLabel={getOptionLabelForManifestSearchBar}
                    label={t("filterManifest")}
                    setSearchedData={handleSetSearchManifest}
                    setFilter={setManifestFiltered}
                    handleFiltered={handleFiltered}
                  />
                </Grid>
              </Grid>
            )}
            <Grid item container spacing={2}>
              {!createManifestIsOpen && (
                <Grid
                  item
                  sx={{
                    position: "fixed",
                    right: "10px",
                    bottom: "3px",
                    zIndex: 999,
                  }}
                >
                  <SpeedDialTooltipOpen actions={actions} />
                </Grid>
              )}
              <Grid item>
                <VisuallyHiddenInput
                  id="hiddenFileInput"
                  type="file"
                  onChange={handleCreateManifest}
                />
              </Grid>
            </Grid>
          </Grid>
          {!manifests.length && !createManifestIsOpen && (
            <Grid container justifyContent={"center"}>
              <Typography variant="h6" component="h2">
                {t("no_manifest_yet")}
              </Typography>
            </Grid>
          )}
          {!searchedManifest &&
            !createManifestIsOpen &&
            manifestFiltered &&
            manifestFiltered.length < 1 && (
              <Grid
                item
                container
                spacing={1}
                flexDirection="column"
                sx={{ marginBottom: "70px" }}
              >
                {currentPageData.map((manifest, index) => (
                  <Grid item key={manifest.id}>
                    <MMUCard
                      objectTypes={ObjectTypes.MANIFEST}
                      AddAccessListItemFunction={handleGrantAccess}
                      DefaultButton={
                        <Grid
                          item
                          container
                          spacing={1}
                          flexDirection={"row"}
                          wrap="nowrap"
                        >
                          <Grid item>
                            <ModalButton
                              tooltipButton={t("tooltipButtonCopy")}
                              onClickFunction={
                                manifest.hash
                                  ? () =>
                                      HandleCopyToClipBoard(
                                        `${caddyUrl}/${manifest.hash}/${manifest.path}`,
                                      )
                                  : () => HandleCopyToClipBoard(manifest.path)
                              }
                              disabled={false}
                              icon={<ContentCopyIcon />}
                            />
                          </Grid>
                          <Grid item>
                            <ModalButton
                              tooltipButton={t("OpenInMirador")}
                              onClickFunction={
                                manifest.hash
                                  ? () =>
                                      window.open(
                                        `${window.location.origin}/manifest/${manifest.hash}/${manifest.path}`,
                                        "_blank",
                                      )
                                  : () =>
                                      window.open(
                                        `${window.location.origin}/manifest/${encodeURI(manifest.path)}`,
                                        "_blank",
                                      )
                              }
                              disabled={false}
                              icon={<OpenInNewIcon />}
                            />
                          </Grid>
                        </Grid>
                      }
                      EditorButton={
                        <ModalButton
                          tooltipButton={t("tooltipButtonEdit")}
                          onClickFunction={() => HandleOpenModal(manifest.id)}
                          icon={<ModeEditIcon />}
                          disabled={false}
                        />
                      }
                      HandleOpenModal={() => HandleOpenModal(manifest.id)}
                      deleteItem={handleDeleteManifest}
                      description={manifest.description}
                      getAccessToItem={getAllManifestGroups}
                      getOptionLabel={getOptionLabel}
                      getGroupByOption={getGroupByOption}
                      id={manifest.id}
                      item={manifest}
                      itemLabel={manifest.title}
                      listOfItem={listOfGroup}
                      metadata={manifest.metadata}
                      openModal={openModalManifestId === manifest.id}
                      rights={manifest.rights!}
                      searchBarLabel={t("searchLabel")}
                      searchModalEditItem={handleLookingForUserGroups}
                      setItemToAdd={setUserToAdd}
                      setItemList={setGroupList}
                      thumbnailUrl={thumbnailUrls[index]}
                      updateItem={handleUpdateManifest}
                      handleSelectorChange={handleChangeRights}
                      handleRemoveFromList={() =>
                        handleRemoveManifestFromList(
                          manifest.id,
                          manifest.share ? manifest.share : undefined,
                        )
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          {!searchedManifest &&
            !createManifestIsOpen &&
            manifestFiltered &&
            manifestFiltered.length > 0 && (
              <Grid
                item
                container
                spacing={1}
                flexDirection="column"
                sx={{ marginBottom: "70px" }}
              >
                {manifestFiltered.map((manifest, index) => (
                  <Grid item key={manifest.id}>
                    <MMUCard
                      objectTypes={ObjectTypes.MANIFEST}
                      AddAccessListItemFunction={handleGrantAccess}
                      DefaultButton={
                        <ModalButton
                          tooltipButton={t("tooltipButtonCopy")}
                          onClickFunction={
                            manifest.hash
                              ? () =>
                                  HandleCopyToClipBoard(
                                    `${caddyUrl}/${manifest.hash}/${manifest.path}`,
                                  )
                              : () => HandleCopyToClipBoard(manifest.path)
                          }
                          disabled={false}
                          icon={<ContentCopyIcon />}
                        />
                      }
                      EditorButton={
                        <ModalButton
                          tooltipButton={t("tooltipButtonEdit")}
                          onClickFunction={() => HandleOpenModal(manifest.id)}
                          icon={<ModeEditIcon />}
                          disabled={false}
                        />
                      }
                      HandleOpenModal={() => HandleOpenModal(manifest.id)}
                      deleteItem={handleDeleteManifest}
                      description={manifest.description}
                      getAccessToItem={getAllManifestGroups}
                      getOptionLabel={getOptionLabel}
                      getGroupByOption={getGroupByOption}
                      id={manifest.id}
                      item={manifest}
                      itemLabel={manifest.title}
                      listOfItem={listOfGroup}
                      metadata={manifest.metadata}
                      openModal={openModalManifestId === manifest.id}
                      rights={manifest.rights!}
                      searchBarLabel={t("searchLabel")}
                      searchModalEditItem={handleLookingForUserGroups}
                      setItemToAdd={setUserToAdd}
                      setItemList={setGroupList}
                      thumbnailUrl={thumbnailUrls[index]}
                      updateItem={handleUpdateManifest}
                      handleSelectorChange={handleChangeRights}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          {searchedManifest && !createManifestIsOpen && (
            <Grid
              item
              container
              spacing={1}
              flexDirection="column"
              sx={{ marginBottom: "70px" }}
            >
              <Grid item key={searchedManifest.id}>
                <MMUCard
                  objectTypes={ObjectTypes.MANIFEST}
                  AddAccessListItemFunction={handleGrantAccess}
                  DefaultButton={
                    <ModalButton
                      tooltipButton={t("tooltipButtonCopy")}
                      onClickFunction={
                        searchedManifest.hash
                          ? () =>
                              HandleCopyToClipBoard(
                                `${caddyUrl}/${searchedManifest.hash}/${searchedManifest.path}`,
                              )
                          : () => HandleCopyToClipBoard(searchedManifest.path)
                      }
                      disabled={false}
                      icon={<ContentCopyIcon />}
                    />
                  }
                  EditorButton={
                    <ModalButton
                      tooltipButton={t("tooltipButtonEdit")}
                      onClickFunction={() =>
                        HandleOpenModal(searchedManifest.id)
                      }
                      icon={<ModeEditIcon />}
                      disabled={false}
                    />
                  }
                  HandleOpenModal={() => HandleOpenModal(searchedManifest.id)}
                  deleteItem={handleDeleteManifest}
                  description={searchedManifest.description}
                  getAccessToItem={getAllManifestGroups}
                  getOptionLabel={getOptionLabel}
                  getGroupByOption={getGroupByOption}
                  id={searchedManifest.id}
                  item={searchedManifest}
                  itemLabel={searchedManifest.title}
                  listOfItem={listOfGroup}
                  metadata={searchedManifest.metadata}
                  openModal={openModalManifestId === searchedManifest.id}
                  rights={searchedManifest.rights!}
                  searchBarLabel={t("searchLabel")}
                  searchModalEditItem={handleLookingForUserGroups}
                  setItemToAdd={setUserToAdd}
                  setItemList={setGroupList}
                  thumbnailUrl={thumbnailUrls[searchedManifestIndex!]}
                  updateItem={handleUpdateManifest}
                  handleSelectorChange={handleChangeRights}
                />
              </Grid>
            </Grid>
          )}
          {!manifestFiltered && (
            <Grid item container justifyContent="center" alignItems="center">
              <Typography variant="h6" component="h2">
                There is no manifest matching your filter.
              </Typography>
            </Grid>
          )}
          {createManifestIsOpen && (
            <Grid
              item
              container
              spacing={2}
              flexDirection="column"
              sx={{ marginBottom: "70px", width: "100%" }}
            >
              <SidePanelMedia
                display={true}
                medias={medias}
                userPersonalGroup={userPersonalGroup}
                fetchMediaForUser={fetchMediaForUser}
                user={user}
                open={openSidePanel}
                setOpen={handleSetOpenSidePanel}
              >
                <ManifestCreationForm
                  handleSubmit={handleSubmitManifestCreationForm}
                  t={t}
                />
              </SidePanelMedia>
            </Grid>
          )}
          <Grid>
            <DrawerLinkManifest
              linkingManifest={handleLinkManifest}
              modalCreateManifestIsOpen={modalLinkManifestIsOpen}
              toggleModalManifestCreation={() =>
                setModalLinkManifestIsOpen(!modalLinkManifestIsOpen)
              }
            />
          </Grid>
          {!createManifestIsOpen && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </Grid>
      </SidePanelMedia>
    </>
  );
};
