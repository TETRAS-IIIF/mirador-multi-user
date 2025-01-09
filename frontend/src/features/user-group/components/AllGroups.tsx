import { User } from "../../auth/types/types.ts";
import { Grid, Typography } from "@mui/material";
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { CreateGroupDto, LinkUserGroup, ItemsRights, UserGroup } from "../types/types.ts";
import { getAllUserGroups } from "../api/getAllUserGroups.ts";
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
import { getUserGroupMedias } from "../../media/api/getUserGroupMedias.ts";
import { PaginationControls } from "../../../components/elements/Pagination.tsx";
import { ObjectTypes } from "../../tag/type.ts";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";


interface allGroupsProps {
  user: User;
  medias:Media[];
  setMedias:Dispatch<SetStateAction<Media[]>>
  userPersonalGroup:UserGroup
  fetchGroups:()=>void
  groups:UserGroup[]
  setGroups:Dispatch<SetStateAction<UserGroup[]>>
}
export const AllGroups= ({user, medias, setMedias,userPersonalGroup,fetchGroups, groups,setGroups}:allGroupsProps)=>{
  const [modalGroupCreationIsOpen, setModalGroupCreationIsOpen] = useState(false)
  const [selectedUserGroup, setSelectedUserGroup] = useState<UserGroup | null>(null);
  const [openModalGroupId, setOpenModalGroupId] = useState<number | null>(null); // Updated state
  const [userToAdd, setUserToAdd ] = useState<LinkUserGroup | null>(null)
  const [userPersonalGroupList, setUserPersonalGroupList] = useState<LinkUserGroup[]>([])
  const [groupFiltered, setGroupFiltered] = useState<UserGroup[] | undefined>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openSidePanel , setOpenSidePanel] = useState(false);
  const { t } = useTranslation();

  const itemsPerPage = 5;

  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return groups.slice(start, end);
  }, [currentPage, groups]);

  const totalPages = Math.ceil(groups.length / itemsPerPage);

  const fetchMediaForUser = async()=>{
    const medias = await getUserGroupMedias(userPersonalGroup!.id)
    setMedias(medias);
  }


  useEffect(
    () =>{
      fetchGroups()
    },[openModalGroupId, user]
  )
  const handleCreateGroup = async (title:string)=>{
    try{
      const userGroupToCreate : CreateGroupDto = {
        title: title,
        ownerId: user.id,
        user: user
      }
      const groupCreated = await createGroup(userGroupToCreate);
      fetchGroups()
      HandleOpenModal(groupCreated.id)
    }catch(error){
      console.error(error)
    }
  }

  const toggleModalGroupCreation = useCallback(()=>{
    setModalGroupCreationIsOpen(!modalGroupCreationIsOpen);
  },[modalGroupCreationIsOpen,setModalGroupCreationIsOpen])


  const getOptionLabel = (option: UserGroup): string => {
    if(option.title){
      return option.title
    }
    return ''
  };

  const getOptionLabelForEditModal = (option: LinkUserGroup , searchInput: string): string => {
    const user = option.user;
    if (user.name.toLowerCase().includes(searchInput.toLowerCase())) {
      return user.name;
    }
    return user.name
  };


  const handleChangeRights = async(group: ListItem,eventValue:string, groupId:number) =>{
    const userToUpdate = userPersonalGroupList.find((user)=>user.user.id=== group.id)
    await  ChangeAccessToGroup(groupId, {userId: userToUpdate!.user.id, groupId: group.id, rights: eventValue as ItemsRights} );
  }

  const HandleOpenModal =useCallback ((groupId: number)=>{
    setOpenModalGroupId(openModalGroupId === groupId ? null : groupId); // Updated logic
  },[openModalGroupId, setOpenModalGroupId])

  const handleDeleteGroup = useCallback(async (groupId: number) => {
    await deleteGroup(groupId);
    fetchGroups()
  },[groups, setGroups])

  const updateGroup= useCallback(async (groupUpdated: UserGroup) => {
    const dataForUpdate = {
      ...groupUpdated
    }

    await UpdateGroup(dataForUpdate);
    fetchGroups()
  },[groups, setGroups])


  const grantingAccessToGroup = async ( user_group_id: number) => {
    if(userToAdd == null){
      toast.error(t('selectItemToast'))
    }
    const user_group = groups.find((groups)=> groups.id === user_group_id)
    await grantAccessToGroup(userToAdd!.user, user_group! )
  }
  const listOfUserPersonalGroup = useMemo(()=>{
    return userPersonalGroupList.map((userPersonalGroup) => ({
      id: userPersonalGroup.user.id,
      title: userPersonalGroup.user.name,
      rights: userPersonalGroup.rights
    }))
  },[userPersonalGroupList])

  const handleRemoveUser= async (groupId: number, userToRemoveId: number)=>{
    await removeAccessToGroup(groupId, userToRemoveId)
  }

  const handleLookingForGroup =(partialString:string)=>{
    return groups.filter((groups) => groups.title.startsWith(partialString))
  }

  const handleFiltered = (partialString:string)=>{
    if(partialString.length < 1){
      return setGroupFiltered([])
    }
    if(partialString.length > 0 ){
      const groupsFiltered = groups.filter((group)=>group.title.startsWith(partialString))
      if(groupsFiltered.length >= 1){
        setGroupFiltered(groupsFiltered)
      }else{
        setGroupFiltered(undefined)
      }
    }
  }

  const handleSetOpenSidePanel=()=>{
    setOpenSidePanel(!openSidePanel)
  }
  return(
    <>
      <SidePanelMedia  open={openSidePanel && !!openModalGroupId} setOpen={handleSetOpenSidePanel} display={!!openModalGroupId} fetchMediaForUser={fetchMediaForUser} medias={medias} user={user} userPersonalGroup={userPersonalGroup!}>
        <Grid item container flexDirection="column" spacing={1}>
          <Grid item container direction="row-reverse" spacing={2} alignItems="center"  sx={{position:'sticky', top:0, zIndex:1000, backgroundColor:'#dcdcdc', paddingBottom:"10px"}}>
            <Grid item>
              <SearchBar handleFiltered={handleFiltered} label={t('filterGroups')} fetchFunction={handleLookingForGroup} getOptionLabel={getOptionLabel} setSelectedData={setSelectedUserGroup}/>
            </Grid>
          </Grid>
          <Grid item container spacing={2} flexDirection="column" sx={{ marginBottom: "40px" }}>
            {!groups.length && (
              <Grid
                container
                justifyContent={"center"}
              >
                <Typography variant="h6" component="h2">{t('noGroupYet')}</Typography>
              </Grid>
            )}
            {groups && groupFiltered && groupFiltered.length < 1 &&!selectedUserGroup && currentPageData.map((group) => (
              <Grid item key={group.id}>
                <MMUCard
                  objectTypes={ObjectTypes.GROUP}
                  isGroups={true}
                  thumbnailUrl={group.thumbnailUrl ? group.thumbnailUrl : null }
                  searchBarLabel={"Search Users"}
                  rights={group.rights!}
                  itemLabel={group.title}
                  openModal={openModalGroupId === group.id}
                  getOptionLabel={getOptionLabelForEditModal}
                  deleteItem={handleDeleteGroup}
                  item={group}
                  updateItem={updateGroup}
                  HandleOpenModal={()=>HandleOpenModal(group.id)}
                  id={group.id}
                  AddAccessListItemFunction={grantingAccessToGroup}
                  EditorButton={<ModalButton tooltipButton={t('editGroupTooltip')} disabled={false} icon={<ModeEditIcon/>} onClickFunction={()=>HandleOpenModal(group.id)}/>}
                  ReaderButton={<ModalButton disabled={true} tooltipButton={t('openGroupTooltip')} icon={<ModeEditIcon/>} onClickFunction={()=>console.log("you're not allowed to do this")}/>}
                  getAccessToItem={GetAllGroupUsers}
                  listOfItem={listOfUserPersonalGroup}
                  removeAccessListItemFunction={handleRemoveUser}
                  searchModalEditItem={lookingForUsers}
                  setItemList={setUserPersonalGroupList}
                  setItemToAdd={setUserToAdd}
                  description={group.description}
                  handleSelectorChange={handleChangeRights}
                />
              </Grid>
            ))}
            {selectedUserGroup &&(
              <Grid item>
                <MMUCard
                  objectTypes={ObjectTypes.GROUP}
                  isGroups={true}
                  thumbnailUrl={selectedUserGroup.thumbnailUrl ? selectedUserGroup.thumbnailUrl : null }
                  searchBarLabel={"Search Users"}
                  rights={selectedUserGroup.rights!}
                  itemLabel={selectedUserGroup.title}
                  openModal={openModalGroupId === selectedUserGroup.id}
                  getOptionLabel={getOptionLabel}
                  deleteItem={handleDeleteGroup}
                  item={selectedUserGroup}
                  updateItem={updateGroup}
                  HandleOpenModal={()=>HandleOpenModal(selectedUserGroup.id)}
                  id={selectedUserGroup.id}
                  AddAccessListItemFunction={grantingAccessToGroup}
                  EditorButton={<ModalButton tooltipButton={t('editGroupTooltip')} disabled={false} icon={<ModeEditIcon/>} onClickFunction={()=>HandleOpenModal(selectedUserGroup.id)}/>}
                  ReaderButton={<ModalButton tooltipButton={t('openGroupTooltip')} disabled={true} icon={<ModeEditIcon/>} onClickFunction={()=>console.log("you're not allowed to do this")}/>}
                  getAccessToItem={getAllUserGroups}
                  listOfItem={listOfUserPersonalGroup}
                  removeAccessListItemFunction={handleRemoveUser}
                  searchModalEditItem={lookingForUsers}
                  setItemList={setUserPersonalGroupList}
                  setItemToAdd={setUserToAdd}
                  description={selectedUserGroup.description}
                  handleSelectorChange={handleChangeRights}
                />
              </Grid>
            )}
            {groups && groupFiltered && groupFiltered.length > 0 &&!selectedUserGroup && groupFiltered.map((group) => (
              <Grid item key={group.id}>
                <MMUCard
                  objectTypes={ObjectTypes.GROUP}
                  isGroups={true}
                  thumbnailUrl={group.thumbnailUrl ? group.thumbnailUrl : null }
                  searchBarLabel={"Search Users"}
                  rights={group.rights!}
                  itemLabel={group.title}
                  openModal={openModalGroupId === group.id}
                  getOptionLabel={getOptionLabelForEditModal}
                  deleteItem={handleDeleteGroup}
                  item={group}
                  updateItem={updateGroup}
                  HandleOpenModal={()=>HandleOpenModal(group.id)}
                  id={group.id}
                  AddAccessListItemFunction={grantingAccessToGroup}
                  EditorButton={<ModalButton tooltipButton={t('editGroupTooltip')}disabled={false} icon={<ModeEditIcon/>} onClickFunction={()=>HandleOpenModal(group.id)}/>}
                  ReaderButton={<ModalButton disabled={true} tooltipButton={t('openGroupTooltip')} icon={<ModeEditIcon/>} onClickFunction={()=>console.log("you're not allowed to do this")}/>}
                  getAccessToItem={GetAllGroupUsers}
                  listOfItem={listOfUserPersonalGroup}
                  removeAccessListItemFunction={handleRemoveUser}
                  searchModalEditItem={lookingForUsers}
                  setItemList={setUserPersonalGroupList}
                  setItemToAdd={setUserToAdd}
                  description={group.description}
                  handleSelectorChange={handleChangeRights}
                />
              </Grid>
            ))}
            {
              !groupFiltered && (
                <Grid item container justifyContent="center" alignItems="center">
                  <Typography variant="h6" component="h2">{t('noMatchingGroupFilter')}</Typography>
                </Grid>
              )
            }
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}/>
          </Grid>
          <FloatingActionButton onClick={toggleModalGroupCreation} content={t('newGroup')} Icon={<AddIcon />} />
          <DrawerCreateGroup handleCreatGroup={handleCreateGroup} modalCreateGroup={modalGroupCreationIsOpen} toggleModalGroupCreation={toggleModalGroupCreation}/>
        </Grid>
      </SidePanelMedia>
    </>
  )
}
