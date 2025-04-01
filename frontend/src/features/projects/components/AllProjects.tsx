import { Grid, IconButton, Tooltip, Typography } from "@mui/material";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Project,
  ProjectGroup,
  ProjectGroupUpdateDto,
} from "../types/types.ts";
import IState from "../../mirador/interface/IState.ts";
import { User } from "../../auth/types/types.ts";
import { deleteProject } from "../api/deleteProject.ts";
import { updateProject } from "../api/updateProject";
import { createProject } from "../api/createProject";
import { FloatingActionButton } from "../../../components/elements/FloatingActionButton.tsx";
import { DrawerCreateProject } from "./DrawerCreateProject.tsx";
import { SearchBar } from "../../../components/elements/SearchBar.tsx";
import { getUserPersonalGroup } from "../api/getUserPersonalGroup.ts";
import {
  ItemsRights,
  LinkUserGroup,
  UserGroup,
  UserGroupTypes,
} from "../../user-group/types/types.ts";
import MMUCard from "../../../components/elements/MMUCard.tsx";
import { removeProjectToGroup } from "../../user-group/api/removeProjectToGroup.ts";
import { addProjectToGroup } from "../../user-group/api/addProjectToGroup.ts";
import { ListItem } from "../../../components/types.ts";
import { getGroupsAccessToProject } from "../api/getGroupsAccessToProject.ts";
import AddIcon from "@mui/icons-material/Add";
import { ModalButton } from "../../../components/elements/ModalButton.tsx";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { lookingForUserGroups } from "../../user-group/api/lookingForUserGroups.ts";
import { Media } from "../../media/types/types.ts";
import { SidePanelMedia } from "../../media/component/SidePanelMedia.tsx";
import { PaginationControls } from "../../../components/elements/Pagination.tsx";
import { updateAccessToProject } from "../api/UpdateAccessToProject.ts";
import SettingsIcon from "@mui/icons-material/Settings";
import { ObjectTypes } from "../../tag/type.ts";
import toast from "react-hot-toast";
import { duplicateProject } from "../api/duplicateProject.ts";
import { getUserNameWithId } from "../../auth/api/getUserNameWithId.ts";
import { isProjectLocked } from "../api/isProjectLocked.ts";
import { handleLock } from "../api/handleLock.ts";
import { useTranslation } from "react-i18next";
import { dublinCoreMetadata } from "../../../utils/dublinCoreMetadata.ts";
import { SortItemSelector } from "../../../components/elements/sortItemSelector.tsx";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { removeProjectFromList } from "../api/removeProjectFromList.ts";
import {
  TITLE,
  UPDATED_AT,
  useCurrentPageData,
} from "../../../utils/customHooks/filterHook.ts";

interface AllProjectsProps {
  user: User;
  setSelectedProjectId: (id: number) => void;
  fetchProjects: () => void;
  selectedProjectId?: number;
  setUserProjects: (userProjects: Project[]) => void;
  userProjects: Project[];
  handleSetMiradorState: (state: IState | undefined) => void;
  fetchMediaForUser: ()=>void;
  medias: Media[];
}

export const AllProjects = ({
  fetchMediaForUser,
  medias,
  user,
  selectedProjectId,
  setSelectedProjectId,
  userProjects,
  setUserProjects,
  handleSetMiradorState,
  fetchProjects,
}: AllProjectsProps) => {
  const [userPersonalGroup, setUserPersonalGroup] = useState<UserGroup>();
  const [openModalProjectId, setOpenModalProjectId] = useState<number | null>(
    null,
  );
  const [userToAdd, setUserToAdd] = useState<LinkUserGroup | null>(null);
  const [modalCreateProjectIsOpen, setModalCreateProjectIsOpen] =
    useState(false);
  const [groupList, setGroupList] = useState<ProjectGroup[]>([]);
  const [userGroupsSearch, setUserGroupSearch] = useState<LinkUserGroup[]>([]);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openSidePanel, setOpenSidePanel] = useState(false);
  const [sortField, setSortField] = useState<keyof Project>(UPDATED_AT);
  const [sortOrder, setSortOrder] = useState("desc");

  const { t } = useTranslation();

  const itemsPerPage = 10;

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  const totalPages = Math.ceil(userProjects.length / itemsPerPage);

  const currentPageData = useCurrentPageData({
    currentPage,
    sortField,
    sortOrder,
    items: userProjects,
    itemsPerPage,
    filter: projectFilter,
  });

  const fetchUserPersonalGroup = async () => {
    const personalGroup = await getUserPersonalGroup(user.id);
    setUserPersonalGroup(personalGroup);
  };
  useEffect(() => {
    fetchProjects();
    fetchUserPersonalGroup();
  }, [openModalProjectId]);

  const deleteUserProject = async (projectId: number) => {
    await deleteProject(projectId);
    setOpenModalProjectId(null);
    fetchProjects();
  };

  const updateUserProject = async (projectUpdated: Project) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rights, share, shared, ...projectToUpdate } = projectUpdated;
    let updatedProject: ProjectGroupUpdateDto;
    if (rights) {
      updatedProject = {
        project: { ...projectToUpdate },
        group: userPersonalGroup,
        rights: rights,
      };
    } else {
      updatedProject = {
        project: { ...projectToUpdate },
        group: userPersonalGroup,
      };
    }
    await updateProject({ ...updatedProject });
    fetchProjects();
  };

  const initializeMirador = useCallback(
    async (miradorState: IState | undefined, projectUser: Project) => {
      try {
        const Locked = await isProjectLocked(projectUser.id);
        if (Locked) {
          const userName = await getUserNameWithId(Locked);
          return toast.error(t("errorProjectAlreadyOpen")+ userName);
        }
        await handleLock({ projectId: projectUser.id, lock: true });
      } catch (error) {
        console.error(error);
        toast.error(error as string);
      }
      setSelectedProjectId(projectUser.id);
      handleSetMiradorState(miradorState);
    },
    [handleSetMiradorState, setSelectedProjectId],
  );

  const toggleModalProjectCreation = useCallback(() => {
    setModalCreateProjectIsOpen(!modalCreateProjectIsOpen);
  }, [modalCreateProjectIsOpen, setModalCreateProjectIsOpen]);

  const HandleOpenModal = useCallback(
    (projectId: number) => {
      const newModalProjectId =
        openModalProjectId === projectId ? null : projectId;
      setOpenModalProjectId(newModalProjectId);
    },
    [setOpenModalProjectId, openModalProjectId],
  );

  const InitializeProject = useCallback(
    async (projectName: string) => {
      const response = await createProject({
        title: projectName,
        ownerId: user.id,
        userWorkspace: undefined,
        metadata: { ...dublinCoreMetadata },
      });
      HandleOpenModal(response.id);
      toggleModalProjectCreation();
    },
    [
      HandleOpenModal,
      setUserProjects,
      toggleModalProjectCreation,
      user,
      userProjects,
    ],
  );

  const handleAddUser = async (projectId: number) => {
    if (userToAdd == null) {
      toast.error(t("errorAddUser"));
    }
    const linkUserGroupToAdd = userGroupsSearch.find(
      (linkUserGroup) => linkUserGroup.user_group.id === userToAdd!.id,
    );
    await addProjectToGroup({
      projectId: projectId,
      groupId: linkUserGroupToAdd!.user_group.id,
    });
  };

  const handleRemoveUser = async (
    projectId: number,
    userToRemoveId: number,
  ) => {
    await removeProjectToGroup({
      groupId: userToRemoveId,
      projectId: projectId,
    });
  };

  const getOptionLabel = (option: UserGroup): string => {
    return option.title;
  };

  const handleChangeRights = async (
    group: ListItem,
    eventValue: string,
    projectId: number,
  ) => {
    const newRights = await updateAccessToProject(projectId, group.id, eventValue as ItemsRights);
    if(newRights.error) {
    toast.error(t('not_allowed_to_modify_rights'))
    }
  };

  const listOfGroup: ListItem[] = useMemo(() => {
    return groupList.map((projectGroup) => ({
      id: projectGroup.user_group.id,
      title: projectGroup.user_group.title,
      rights: projectGroup.rights,
      type: projectGroup.user_group.type,
      personalOwnerGroupId: projectGroup.personalOwnerGroupId
    }));
  }, [groupList]);

  const handleLookingForUserGroups = async (partialString: string) => {
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

  const getGroupByOption = (option: UserGroup): string => {
    if (option.type === UserGroupTypes.MULTI_USER) {
      return t("groups");
    } else {
      return t("users");
    }
  };

  const handleDuplicateProject = async (projectId: number) => {
    await duplicateProject(projectId);
    setOpenModalProjectId(null);
  };

  const handleSetOpenSidePanel = () => {
    setOpenSidePanel(!openSidePanel);
  };

  const handleRemoveProjectFromList = async (
    projectId: number,
    share: string | undefined,
  ) => {
    if (share) {
      toast.error(t("share-project-error-message"));
      return;
    } else {
      await removeProjectFromList(projectId);
      toast.success(t("removedProjectFromList"));
      fetchProjects();
      return;
    }
  };

  return (
    <>
      <SidePanelMedia
        open={openSidePanel && !!openModalProjectId}
        setOpen={handleSetOpenSidePanel}
        display={!!openModalProjectId}
        fetchMediaForUser={fetchMediaForUser}
        medias={medias}
        user={user}
        userPersonalGroup={userPersonalGroup!}
      >
        <Grid container justifyContent="center" flexDirection="column">
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
              paddingBottom: "18px",
            }}
          >
            {!selectedProjectId && (
              <Grid
                item
                container
                justifyContent="flex-end"
                spacing={2}
                alignItems="center"
              >
                <Grid item>
                  <SearchBar
                    label={t("filterProjects")}
                    setFilter={setProjectFilter}
                  />
                </Grid>
                <Grid item>
                  <SortItemSelector<Project>
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
          </Grid>
          <Grid item container spacing={1}>
            {!userProjects.length && (
              <Grid container justifyContent={"center"}>
                <Typography variant="h6" component="h2">
                  {t("messageNoProject")}
                </Typography>
              </Grid>
            )}
            {!selectedProjectId && userProjects && (
              <Grid
                item
                container
                spacing={1}
                flexDirection="column"
                sx={{ marginBottom: "70px" }}
              >
                {userProjects.length > 0 &&
                  (currentPageData.length > 0 ? (
                    currentPageData.map((projectUser) => (
                      <Grid item key={projectUser.id}>
                        <MMUCard
                          ownerId={projectUser.ownerId}
                          duplicateItem={handleDuplicateProject}
                          objectTypes={ObjectTypes.PROJECT}
                          thumbnailUrl={
                            projectUser.thumbnailUrl
                              ? projectUser.thumbnailUrl
                              : null
                          }
                          searchBarLabel={t("searchUser")}
                          description={projectUser.description}
                          HandleOpenModal={() =>
                            HandleOpenModal(projectUser.id)
                          }
                          openModal={openModalProjectId === projectUser.id}
                          DefaultButton={
                            <ModalButton
                              tooltipButton={t("openProject")}
                              onClickFunction={() =>
                                initializeMirador(
                                  projectUser.userWorkspace,
                                  projectUser,
                                )
                              }
                              disabled={false}
                              icon={<OpenInNewIcon />}
                            />
                          }
                          EditorButton={
                            <ModalButton
                              tooltipButton={t("configuration")}
                              onClickFunction={() =>
                                HandleOpenModal(projectUser.id)
                              }
                              icon={<SettingsIcon />}
                              disabled={false}
                            />
                          }
                          id={projectUser.id}
                          rights={projectUser.rights!}
                          deleteItem={deleteUserProject}
                          getOptionLabel={getOptionLabel}
                          AddAccessListItemFunction={handleAddUser}
                          handleSelectorChange={handleChangeRights}
                          item={projectUser}
                          itemLabel={projectUser.title}
                          listOfItem={listOfGroup}
                          searchModalEditItem={handleLookingForUserGroups}
                          getAccessToItem={getGroupsAccessToProject}
                          setItemToAdd={setUserToAdd}
                          updateItem={updateUserProject}
                          removeAccessListItemFunction={handleRemoveUser}
                          setItemList={setGroupList}
                          metadata={projectUser.metadata}
                          getGroupByOption={getGroupByOption}
                          handleRemoveFromList={handleRemoveProjectFromList}
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
                        {t("noProjectMatchFilter")}
                      </Typography>
                    </Grid>
                  ))}
                <Grid item>
                  <FloatingActionButton
                    onClick={toggleModalProjectCreation}
                    content={t("newProject")}
                    Icon={<AddIcon />}
                  />
                  <div>
                    <DrawerCreateProject
                      InitializeProject={InitializeProject}
                      toggleModalProjectCreation={toggleModalProjectCreation}
                      modalCreateProjectIsOpen={modalCreateProjectIsOpen}
                    />
                  </div>
                </Grid>
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </Grid>
            )}
          </Grid>
        </Grid>
      </SidePanelMedia>
    </>
  );
};
