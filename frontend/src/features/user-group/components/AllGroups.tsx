import { User } from "../../auth/types/types.ts";
import { Grid, IconButton, Tooltip, Typography } from "@mui/material";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CreateGroupDto,
  ItemsRights,
  LinkUserGroup,
  UserGroup,
} from "../types/types.ts";
import { FloatingActionButton } from "../../../components/elements/FloatingActionButton.tsx";
import AddIcon from "@mui/icons-material/Add";
import { DrawerCreateGroup } from "./DrawerCreateGroup.tsx";
import { createGroup } from "../api/createGroup.ts";
import { SearchBar } from "../../../components/elements/SearchBar.tsx";
import MMUCard from "../../../components/elements/MMUCard.tsx";
import { ChangeAccessToGroup } from "../api/ChangeAccessToGroup.ts";
import { deleteGroup } from "../api/deleteGroup.ts";
import { grantAccessToGroup } from "../api/grantAccessToGroup.ts";
import { removeAccessToGroup } from "../api/removeAccessToGroup.ts";
import { lookingForUsers } from "../api/lookingForUsers.ts";
import { ModalButton } from "../../../components/elements/ModalButton.tsx";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import { UpdateGroup } from "../api/updateGroup.ts";
import { GetAllGroupUsers } from "../api/getAllGroupUsers.ts";
import { ListItem } from "../../../components/types.ts";
import { SidePanelMedia } from "../../media/component/SidePanelMedia.tsx";
import { Media } from "../../media/types/types.ts";
import { PaginationControls } from "../../../components/elements/Pagination.tsx";
import { ObjectTypes } from "../../tag/type.ts";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { SortItemSelector } from "../../../components/elements/sortItemSelector.tsx";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { leavingGroup } from "../api/leavingGroup.ts";
import {
  TITLE,
  UPDATED_AT,
  useCurrentPageData,
} from "../../../utils/customHooks/filterHook.ts";

interface allGroupsProps {
  user: User;
  medias: Media[];
  fetchMediaForUser: () => void;
  userPersonalGroup: UserGroup;
  fetchGroups: () => void;
  groups: UserGroup[];
}

export const AllGroups = ({
  user,
  medias,
  fetchMediaForUser,
  userPersonalGroup,
  fetchGroups,
  groups,
}: allGroupsProps) => {
  const [modalGroupCreationIsOpen, setModalGroupCreationIsOpen] =
    useState(false);
  const [openModalGroupId, setOpenModalGroupId] = useState<number | null>(null); // Updated state
  const [userToAdd, setUserToAdd] = useState<LinkUserGroup | null>(null);
  const [userPersonalGroupList, setUserPersonalGroupList] = useState<
    LinkUserGroup[]
  >([]);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openSidePanel, setOpenSidePanel] = useState(false);
  const [sortField, setSortField] = useState<keyof UserGroup>(UPDATED_AT);
  const [sortOrder, setSortOrder] = useState("desc");

  const { t } = useTranslation();

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  const itemsPerPage = 10;

  const currentPageData = useCurrentPageData({
    currentPage,
    sortField,
    sortOrder,
    items: groups,
    itemsPerPage,
    filter: groupFilter,
  });

  const totalPages = Math.ceil(groups.length / itemsPerPage);

  useEffect(() => {
    fetchGroups();
  }, [openModalGroupId, user]);
  const handleCreateGroup = async (title: string) => {
    try {
      const userGroupToCreate: CreateGroupDto = {
        title: title,
        ownerId: user.id,
        user: user,
      };
      const groupCreated = await createGroup(userGroupToCreate);
      fetchGroups();
      HandleOpenModal(groupCreated.id);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleModalGroupCreation = useCallback(() => {
    setModalGroupCreationIsOpen(!modalGroupCreationIsOpen);
  }, [modalGroupCreationIsOpen, setModalGroupCreationIsOpen]);

  const getOptionLabelForEditModal = (
    option: LinkUserGroup,
    searchInput: string,
  ): string => {
    const user = option.user;
    if (user.name.toLowerCase().includes(searchInput.toLowerCase())) {
      return user.name;
    }
    return user.name;
  };

  const handleChangeRights = async (
    group: ListItem,
    eventValue: string,
    groupId: number,
  ) => {
    const userToUpdate = userPersonalGroupList.find(
      (user) => user.user.id === group.id,
    );
    const newRights = await ChangeAccessToGroup(groupId, {
      groupId: group.id,
      rights: eventValue as ItemsRights,
      userId: userToUpdate!.user.id,
    });
    if(newRights.error) {
      toast.error(t('not_allowed_to_modify_rights'))
    }
  };

  const HandleOpenModal = useCallback(
    (groupId: number) => {
      setOpenModalGroupId(openModalGroupId === groupId ? null : groupId); // Updated logic
    },
    [openModalGroupId, setOpenModalGroupId],
  );

  const handleDeleteGroup = async (groupId: number) => {
    await deleteGroup(groupId);
    fetchGroups();
  };

  const updateGroup = async (groupUpdated: UserGroup) => {
    await UpdateGroup(groupUpdated);
    fetchGroups();
  };

  const grantingAccessToGroup = async (user_group_id: number) => {
    if (userToAdd == null) {
      toast.error(t("selectItemToast"));
    }
    const user_group = groups.find((groups) => groups.id === user_group_id);
    await grantAccessToGroup(userToAdd!.user, user_group!);
  };
  const listOfUserPersonalGroup = useMemo(() => {
    return userPersonalGroupList.map((userPersonalGroup) => ({
      id: userPersonalGroup.user.id,
      title: userPersonalGroup.user.name,
      rights: userPersonalGroup.rights,
      personalOwnerGroupId:userPersonalGroup.personalOwnerGroupId,
    }));
  }, [userPersonalGroupList]);

  const handleRemoveUser = async (groupId: number, userToRemoveId: number) => {
    await removeAccessToGroup(groupId, userToRemoveId);
    fetchGroups()
  };

  const handleSetOpenSidePanel = () => {
    setOpenSidePanel(!openSidePanel);
  };

  const handleLeaveGroup = async (groupId: number) => {
    await leavingGroup(groupId);
    return fetchGroups();
  };

  return (
    <>
      <SidePanelMedia
        open={openSidePanel && !!openModalGroupId}
        setOpen={handleSetOpenSidePanel}
        display={!!openModalGroupId}
        fetchMediaForUser={fetchMediaForUser}
        medias={medias}
        user={user}
        userPersonalGroup={userPersonalGroup!}
      >
        <Grid item container flexDirection="column">
          <Grid
            item
            container
            justifyContent="flex-end"
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1000,
              backgroundColor: "#dcdcdc",
              paddingBottom: "18px",
            }}
          >
            <Grid item>
              <SearchBar label={t("filterGroups")} setFilter={setGroupFilter} />
            </Grid>
            <Grid item>
              <SortItemSelector<UserGroup>
                sortField={sortField}
                setSortField={setSortField}
                fields={[TITLE, UPDATED_AT]}
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
          </Grid>
          <Grid
            item
            container
            spacing={2}
            flexDirection="column"
            sx={{ marginBottom: "40px" }}
          >
            {!groups.length && (
              <Grid
                container
                justifyContent={"center"}
                sx={{ marginTop: "10px" }}
              >
                <Typography variant="h6" component="h2">
                  {t("noGroupYet")}
                </Typography>
              </Grid>
            )}
            {groups.length > 0 &&
              (currentPageData.length > 0 ? (
                currentPageData.map((group:UserGroup) => (
                  <Grid item key={group.id}>
                    <MMUCard
                      ownerId={group.ownerId}
                      objectTypes={ObjectTypes.GROUP}
                      isGroups={true}
                      thumbnailUrl={
                        group.thumbnailUrl ? group.thumbnailUrl : null
                      }
                      searchBarLabel={"Search Users"}
                      rights={group.rights!}
                      itemLabel={group.title}
                      openModal={openModalGroupId === group.id}
                      getOptionLabel={getOptionLabelForEditModal}
                      deleteItem={handleDeleteGroup}
                      item={group}
                      updateItem={updateGroup}
                      HandleOpenModal={() => HandleOpenModal(group.id)}
                      id={group.id}
                      AddAccessListItemFunction={grantingAccessToGroup}
                      EditorButton={
                        <ModalButton
                          tooltipButton={t("editGroupTooltip")}
                          disabled={false}
                          icon={<ModeEditIcon />}
                          onClickFunction={() => HandleOpenModal(group.id)}
                        />
                      }
                      getAccessToItem={GetAllGroupUsers}
                      listOfItem={listOfUserPersonalGroup}
                      removeAccessListItemFunction={handleRemoveUser}
                      searchModalEditItem={lookingForUsers}
                      setItemList={setUserPersonalGroupList}
                      setItemToAdd={setUserToAdd}
                      description={group.description}
                      handleSelectorChange={handleChangeRights}
                      handleRemoveFromList={handleLeaveGroup}
                    />
                  </Grid>
                ))
              ) : (
                <Grid
                  item
                  container
                  justifyContent="center"
                  alignItems="center"
                >
                  <Typography variant="h6" component="h2">
                    {t("noMatchingGroupFilter")}
                  </Typography>
                </Grid>
              ))}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Grid>
          <FloatingActionButton
            onClick={toggleModalGroupCreation}
            content={t("newGroup")}
            Icon={<AddIcon />}
          />
          <DrawerCreateGroup
            handleCreatGroup={handleCreateGroup}
            modalCreateGroup={modalGroupCreationIsOpen}
            toggleModalGroupCreation={toggleModalGroupCreation}
          />
        </Grid>
      </SidePanelMedia>
    </>
  );
};
