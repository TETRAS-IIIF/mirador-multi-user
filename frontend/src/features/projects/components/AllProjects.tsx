import { Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Project,
  ProjectGroup,
  ProjectGroupUpdateDto,
} from '../types/types.ts';
import IState from '../../mirador/interface/IState.ts';
import { User } from '../../auth/types/types.ts';
import { deleteProject } from '../api/Project/deleteProject.ts';
import { updateProject } from '../api/Project/updateProject.ts';
import { createProject } from '../api/Project/createProject.ts';
import { FloatingActionButton } from '../../../components/elements/FloatingActionButton.tsx';
import { DrawerCreateProject } from './DrawerCreateProject.tsx';
import { SearchBar } from '../../../components/elements/SearchBar.tsx';
import { getUserPersonalGroup } from '../api/group/getUserPersonalGroup.ts';
import { LinkUserGroup, UserGroup } from '../../user-group/types/types.ts';
import MMUCard from '../../../components/elements/MMUCard.tsx';
import { removeProjectToGroup } from '../../user-group/api/removeProjectToGroup.ts';
import { addProjectToGroup } from '../../user-group/api/addProjectToGroup.ts';
import { ListItem } from '../../../components/types.ts';
import { getGroupsAccessToProject } from '../api/group/getGroupsAccessToProject.ts';
import AddIcon from '@mui/icons-material/Add';
import { ModalButton } from '../../../components/elements/ModalButton.tsx';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { lookingForUserGroups } from '../../user-group/api/lookingForUserGroups.ts';
import { Media } from '../../media/types/types.ts';
import { PaginationControls } from '../../../components/elements/Pagination.tsx';
import { updateAccessToProject } from '../api/Project/UpdateAccessToProject.ts';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  ITEM_RIGHTS,
  OBJECT_TYPES,
  USER_GROUP_TYPES,
} from '../../../utils/mmu_types.ts';
import toast from 'react-hot-toast';
import { duplicateProject } from '../api/Project/duplicateProject.ts';
import { getUserNameWithId } from '../../auth/api/getUserNameWithId.ts';
import { isProjectLocked } from '../api/Project/isProjectLocked.ts';
import { handleLock } from '../api/Project/handleLock.ts';
import { useTranslation } from 'react-i18next';
import { dublinCoreMetadata } from '../../../utils/dublinCoreMetadata.ts';
import { SortItemSelector } from '../../../components/elements/sortItemSelector.tsx';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { removeProjectFromList } from '../api/Project/removeProjectFromList.ts';
import { SidePanel } from '../../../components/elements/SidePanel/SidePanel.tsx';
import { Manifest } from '../../manifest/types/types.ts';
import {
  TITLE,
  UPDATED_AT,
  useCurrentPageData,
} from '../../../utils/customHooks/filterHook.ts';
import { MMUModal } from '../../../components/elements/modal.tsx';
import { ModalProjectAlreadyOpenByUser } from './ModalProjectAlreadyOpenByUser.tsx';

interface AllProjectsProps {
  user: User;
  setSelectedProjectId: (id: number) => void;
  fetchProjects: () => void;
  selectedProjectId?: number;
  setUserProjects: (userProjects: Project[]) => void;
  userProjects: Project[];
  handleSetMiradorState: (state: IState | undefined) => void;
  fetchMediaForUser: () => void;
  medias: Media[];
  manifests: Manifest[];
  fetchManifestForUser: () => void;
}

export const AllProjects = ({
  fetchMediaForUser,
  medias,
  manifests,
  user,
  selectedProjectId,
  setSelectedProjectId,
  userProjects,
  setUserProjects,
  handleSetMiradorState,
  fetchProjects,
  fetchManifestForUser,
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
  const [sortField, setSortField] = useState<keyof Project>(UPDATED_AT);
  const [sortOrder, setSortOrder] = useState('desc');
  const [openModalConfirmReopenProject, setOpenModalConfirmReopenProject] =
    useState(false);
  const [pendingProject, setPendingProject] = useState<Project | null>(null);
  const [pendingMiradorState, setPendingMiradorState] = useState<
    IState | undefined
  >(undefined);
  const { t } = useTranslation();
  const itemsPerPage = 10;

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
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
    fetchManifestForUser();
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
    const updatedResponse = await updateProject({ ...updatedProject });
    if (updatedResponse) {
      toast.success(
        <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {t('projectSaved', { projectTitle: updatedResponse.title })}
        </div>,
      );
    } else {
      toast.error(
        <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {t('projectSavedFailed', {
            projectTitle: updatedProject.project.title,
          })}
        </div>,
      );
    }
    fetchProjects();
  };

  const initializeMirador = useCallback(
    async (
      miradorState: IState | undefined,
      projectUser: Project,
      forced: boolean = false,
    ) => {
      const SELF_LOCK = -1;
      try {
        if (!forced) {
          const lockStatus = await isProjectLocked(projectUser.id);
          // locked by someone else
          if (typeof lockStatus === 'number' && lockStatus !== SELF_LOCK) {
            const userName = await getUserNameWithId(lockStatus);
            toast.error(t('errorProjectAlreadyOpen') + userName);
            return;
          }
          // locked by current user → open confirmation modal
          if (lockStatus === SELF_LOCK) {
            setPendingProject(projectUser);
            setPendingMiradorState(miradorState);
            setOpenModalConfirmReopenProject(true);
            return;
          }
        }
        await handleLock({ projectId: projectUser.id, lock: true });
      } catch (error) {
        console.error(error);
        toast.error(String(error));
        return;
      }
      setSelectedProjectId(projectUser.id);
      handleSetMiradorState(miradorState);
    },
    [
      handleSetMiradorState,
      setSelectedProjectId,
      t,
      setOpenModalConfirmReopenProject,
      setPendingProject,
      setPendingMiradorState,
    ],
  );

  const handleConfirmForceOpen = useCallback(async () => {
    if (!pendingProject) return;

    await initializeMirador(pendingMiradorState, pendingProject, true);

    setOpenModalConfirmReopenProject(false);
    setPendingProject(null);
    setPendingMiradorState(undefined);
  }, [
    pendingProject,
    pendingMiradorState,
    initializeMirador,
    setOpenModalConfirmReopenProject,
  ]);

  const handleCancelForceOpen = useCallback(() => {
    setOpenModalConfirmReopenProject(false);
    setPendingProject(null);
    setPendingMiradorState(undefined);
  }, [setOpenModalConfirmReopenProject]);

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
      toast.error(t('errorAddUser'));
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
    const newRights = await updateAccessToProject(
      projectId,
      group.id,
      eventValue as ITEM_RIGHTS,
    );
    if (newRights.error) {
      toast.error(t('not_allowed_to_modify_rights'));
    }
  };

  const listOfGroup: ListItem[] = useMemo(() => {
    return groupList.map((projectGroup) => ({
      id: projectGroup.user_group.id,
      title: projectGroup.user_group.title,
      rights: projectGroup.rights,
      type: projectGroup.user_group.type,
      personalOwnerGroupId: projectGroup.personalOwnerGroupId,
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
    if (option.type === USER_GROUP_TYPES.MULTI_USER) {
      return t('groups');
    } else {
      return t('users');
    }
  };

  const handleDuplicateProject = async (projectId: number) => {
    await duplicateProject(projectId);
    setOpenModalProjectId(null);
  };

  const handleRemoveProjectFromList = async (
    projectId: number,
    share: string | undefined,
  ) => {
    if (share) {
      toast.error(t('share-project-error-message'));
      return;
    } else {
      await removeProjectFromList(projectId);
      toast.success(t('removedProjectFromList'));
      fetchProjects();
      return;
    }
  };

  return (
    <>
      <SidePanel
        medias={medias}
        manifests={manifests}
        userPersonalGroup={userPersonalGroup!}
        user={user}
        fetchMediaForUser={fetchMediaForUser}
        fetchManifestForUser={fetchManifestForUser}
        display={!!openModalProjectId}
      >
        <Grid container justifyContent="center" flexDirection="column">
          <Grid
            container
            direction="row-reverse"
            alignItems="center"
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1000,
              backgroundColor: '#dcdcdc',
              paddingBottom: '18px',
            }}
          >
            {!selectedProjectId && (
              <Grid
                container
                justifyContent="flex-end"
                spacing={2}
                alignItems="center"
              >
                <Grid>
                  <SearchBar
                    label={t('filterProjects')}
                    setFilter={setProjectFilter}
                  />
                </Grid>
                <Grid>
                  <SortItemSelector<Project>
                    sortField={sortField}
                    setSortField={setSortField}
                    fields={[TITLE, UPDATED_AT]}
                  />
                </Grid>
                <Grid>
                  <Tooltip
                    title={t(sortOrder === 'asc' ? 'sortAsc' : 'sortDesc')}
                  >
                    <IconButton onClick={toggleSortOrder}>
                      {sortOrder === 'asc' ? (
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
          <Grid container spacing={1}>
            {!userProjects.length && (
              <Grid container justifyContent={'center'} size={12}>
                <Typography variant="h6" component="h2">
                  {t('messageNoProject')}
                </Typography>
              </Grid>
            )}
            {!selectedProjectId && userProjects && (
              <Grid
                container
                spacing={1}
                flexDirection="column"
                size={12}
                sx={{ marginBottom: '70px' }}
              >
                {userProjects.length > 0 &&
                  (currentPageData.length > 0 ? (
                    currentPageData.map((projectUser) => (
                      <Grid key={projectUser.id}>
                        <MMUCard
                          fetchItems={fetchProjects}
                          ownerId={projectUser.ownerId}
                          duplicateItem={handleDuplicateProject}
                          objectTypes={OBJECT_TYPES.PROJECT}
                          thumbnailUrl={
                            projectUser.thumbnailUrl
                              ? projectUser.thumbnailUrl
                              : null
                          }
                          searchBarLabel={t('searchUser')}
                          description={projectUser.description}
                          HandleOpenModal={() =>
                            HandleOpenModal(projectUser.id)
                          }
                          openModal={openModalProjectId === projectUser.id}
                          DefaultButton={
                            <ModalButton
                              tooltipButton={t('openProject')}
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
                              tooltipButton={t('configuration')}
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
                    <Grid container justifyContent="center" alignItems="center">
                      <Typography variant="h6" component="h2">
                        {t('noProjectMatchFilter')}
                      </Typography>
                    </Grid>
                  ))}
                <Grid>
                  <FloatingActionButton
                    onClick={toggleModalProjectCreation}
                    content={t('newProject')}
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
            {openModalConfirmReopenProject && (
              <MMUModal
                openModal={openModalConfirmReopenProject}
                setOpenModal={setOpenModalConfirmReopenProject}
                width={400}
              >
                <ModalProjectAlreadyOpenByUser
                  onConfirm={handleConfirmForceOpen}
                  onCancel={handleCancelForceOpen}
                />
              </MMUModal>
            )}
          </Grid>
        </Grid>
      </SidePanel>
    </>
  );
};
