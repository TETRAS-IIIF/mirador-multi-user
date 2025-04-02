import { Grid, IconButton, styled, Tooltip, Typography } from "@mui/material";
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
import { IIIFResource, ManifestResource } from "manifesto.js";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { removeManifestFromList } from "../api/removeManifestFromList.ts";
import {
  TITLE,
  UPDATED_AT,
  useCurrentPageData,
} from "../../../utils/customHooks/filterHook.ts";
import { removeManifestToGroup } from "../api/removeManifestToGroup.ts";

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
  const [openModalManifestId, setOpenModalManifestId] = useState<number | null>(
    null,
  );
  const [modalLinkManifestIsOpen, setModalLinkManifestIsOpen] = useState(false);
  const [manifestFilter, setManifestFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userGroupSearch, setUserGroupSearch] = useState<LinkUserGroup[]>([]);
  const [userToAdd, setUserToAdd] = useState<LinkUserGroup | null>(null);
  const [groupList, setGroupList] = useState<ProjectGroup[]>([]);
  const [openSidePanel, setOpenSidePanel] = useState(false);
  const [sortField, setSortField] = useState<keyof Manifest>(UPDATED_AT);
  const [sortOrder, setSortOrder] = useState("desc");

  const { t } = useTranslation();

  const itemsPerPage = 10;

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };
  const currentPageData = useCurrentPageData({
    currentPage,
    sortField,
    sortOrder,
    items: manifests,
    itemsPerPage,
    filter: manifestFilter,
  });

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

  useEffect(() => {
    fetchManifestForUser();
  }, []);

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
      for (const canvases of manifestCanvases) {
        if (canvases.media[0].value.length <= 0) {
          return toast.error(t("no_media_error"));
        }
      }
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
      personalOwnerGroupId: projectGroup.user_group.ownerId,
    }));
  }, [groupList]);

  const handleChangeRights = async (
    group: ListItem,
    eventValue: string,
    manifestId: number,
  ) => {
    const newRights = await updateAccessToManifest(
      manifestId,
      group.id,
      eventValue as ManifestGroupRights,
    );
    if(newRights.error) {
      toast.error(t('not_allowed_to_modify_rights'))
    }
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

  const handleRemoveAccess = async (manifestId: number, groupId: number) => {
    await removeManifestToGroup(manifestId, groupId);
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
                  <SearchBar
                    label={t("filterManifest")}
                    setFilter={setManifestFilter}
                  />
                </Grid>
                <Grid item>
                  <SortItemSelector<Manifest>
                    sortField={sortField}
                    setSortField={setSortField}
                    fields={[TITLE, UPDATED_AT]}
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
          {!createManifestIsOpen &&
            manifests.length > 0 &&
            (currentPageData.length > 0 ? (
              <Grid
                item
                container
                spacing={1}
                flexDirection="column"
                sx={{ marginBottom: "70px" }}
              >
                {currentPageData.map((manifest: Manifest) => (
                  <Grid item key={manifest.id}>
                    <MMUCard
                      ownerId={manifest.idCreator}
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
                      getGroupByOption={getGroupByOption}
                      getOptionLabel={getOptionLabel}
                      handleSelectorChange={handleChangeRights}
                      handleRemoveFromList={() =>
                        handleRemoveManifestFromList(
                          manifest.id,
                          manifest.share ? manifest.share : undefined,
                        )
                      }
                      id={manifest.id}
                      item={manifest}
                      itemLabel={manifest.title}
                      listOfItem={listOfGroup}
                      metadata={manifest.metadata}
                      openModal={openModalManifestId === manifest.id}
                      rights={manifest.rights!}
                      searchBarLabel={t("searchLabel")}
                      searchModalEditItem={handleLookingForUserGroups}
                      setItemList={setGroupList}
                      setItemToAdd={setUserToAdd}
                      updateItem={handleUpdateManifest}
                      removeAccessListItemFunction={handleRemoveAccess}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Grid item container justifyContent="center" alignItems="center">
                <Typography variant="h6" component="h2">
                  {t("noMatchingManifestFilter")}
                </Typography>
              </Grid>
            ))}
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
