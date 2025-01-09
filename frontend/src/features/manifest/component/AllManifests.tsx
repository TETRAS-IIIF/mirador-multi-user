import { Grid, styled, Typography } from "@mui/material";
import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { LinkUserGroup, UserGroup, UserGroupTypes } from "../../user-group/types/types.ts";
import { User } from "../../auth/types/types.ts";
import { Manifest, ManifestCreationMedia, ManifestGroupRights, manifestOrigin } from "../types/types.ts";
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
import { getManifestThumbnail } from "../utils/getManifestThumbnail.ts";


const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface IAllManifests{
  userPersonalGroup:UserGroup
  user:User
  fetchManifestForUser:()=>void
  manifests:Manifest[]
  medias:Media[]
  setCreateManifestIsOpen:(createManifestIsOpen:boolean)=>void
  createManifestIsOpen:boolean
  fetchMediaForUser:()=>void

}


const caddyUrl = import.meta.env.VITE_CADDY_URL


export const AllManifests= ({userPersonalGroup, user,fetchManifestForUser,manifests,medias,setCreateManifestIsOpen,createManifestIsOpen,fetchMediaForUser}:IAllManifests) => {
  const [searchedManifest, setSearchedManifest] = useState<Manifest|null>(null);
  const [openModalManifestId, setOpenModalManifestId] = useState<number | null>(null);
  const [searchedManifestIndex,setSearchedManifestIndex] = useState<number | null>(null);
  const [modalLinkManifestIsOpen, setModalLinkManifestSIsOpen] = useState(false)
  const [manifestFiltered, setManifestFiltered] = useState<Manifest[] | undefined>([])
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [userGroupsSearch, setUserGroupSearch] = useState<LinkUserGroup[]>([])
  const [userToAdd, setUserToAdd ] = useState<LinkUserGroup | null>(null)
  const [groupList, setGroupList] = useState<ProjectGroup[]>([]);
  const [openSidePanel , setOpenSidePanel] = useState(false);
  const [sortField, setSortField] = useState<keyof Manifest>("title");

  const { t } = useTranslation();

  const itemsPerPage = 5;

  const sortedItems = useMemo(() => {
    return [...manifests].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortField === "created_at") {
        const aDate = typeof aValue === "string" ? new Date(aValue) : aValue;
        const bDate = typeof bValue === "string" ? new Date(bValue) : bValue;

        return aDate.getTime() - bDate.getTime();
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return aValue - bValue;
      }

      return 0;
    });
  }, [manifests, sortField]);

  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedItems.slice(start, end);
  }, [currentPage, itemsPerPage, sortedItems]);

  const totalPages = Math.ceil(manifests.length / itemsPerPage);

  const handleCreateManifest  = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      await uploadManifest({
        idCreator: user.id,
        file: event.target.files[0],
      });
      fetchManifestForUser()
      setCreateManifestIsOpen(false)
    }
  },[fetchManifestForUser, manifests])

  const HandleOpenModal =useCallback ((manifestId: number)=>{
    setOpenModalManifestId(openModalManifestId === manifestId ? null : manifestId);
  },[setOpenModalManifestId, openModalManifestId]);

  const HandleCreateManifestIsOpen = ()=>{
    setCreateManifestIsOpen(!createManifestIsOpen)
  }

  const actions = [
    { icon: <CreateIcon /> as ReactNode, name: t('actionsDial.create'),onClick: HandleCreateManifestIsOpen},
    { icon: <UploadFileIcon /> as ReactNode, name: t('actionsDial.upload') , onClick: () => {
        document.getElementById("hiddenFileInput")?.click();
      }},
    { icon: <AddLinkIcon /> as ReactNode, name: t('actionsDial.link') ,onClick:() => setModalLinkManifestSIsOpen(!modalLinkManifestIsOpen)},
  ];

  const fetchThumbnails = useCallback(async () => {
    const urls: string[] = await Promise.all(
      currentPageData.map(async (manifest) => {
        if (manifest.thumbnailUrl) {
          return manifest.thumbnailUrl;
        }
        let manifestUrl = '';
        if (manifest.origin === manifestOrigin.UPLOAD) {
          manifestUrl = `${caddyUrl}/${manifest.hash}/${manifest.title}`;
        } else if (manifest.origin === manifestOrigin.LINK) {
          manifestUrl = manifest.path;
        } else if(manifest.origin === manifestOrigin.CREATE){
          manifestUrl = `${caddyUrl}/${manifest.hash}/${manifest.path}`;
        }else{
          return placeholder;
        }
        try {
          const manifestResponse = await fetch(manifestUrl);
          const manifestFetched = await manifestResponse.json();
          const resource = new ManifestResource(manifestFetched,{defaultLabel:"labeltoto", locale:"localetoto", resource: manifestFetched as unknown as IIIFResource, pessimisticAccessControl:false});
          const test = getManifestThumbnail(resource);
          if (manifestFetched.thumbnail) {
            return manifestFetched.thumbnail["@id"];
          } else if(manifestFetched.items[0].thumbnail[0].id){
            return manifestFetched.items[0].thumbnail[0].id;
          }else{
            return placeholder;
          }
        } catch (error) {
          console.error("Error fetching manifest:", error);
          return placeholder;
        }
      })
    );

    setThumbnailUrls(urls);
  }, [currentPageData, caddyUrl]);

// Fetch thumbnails whenever the current page data changes
  useEffect(() => {
    fetchThumbnails();
  }, [fetchThumbnails]);
  const HandleLookingForManifests = async (partialString : string) =>{
    const userManifests =  await lookingForManifests(partialString, userPersonalGroup.id)
    return userManifests
  }

  const getOptionLabelForManifestSearchBar = (option:Manifest): string => {
    return option.title;
  };


  const handleSetSearchManifest = (manifestQuery: Manifest) => {
    if (manifestQuery) {
      const manifestIndex = manifests.findIndex((manifest: Manifest) => manifest.id === manifestQuery.id);
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
    toast.success('path copied to clipboard');
  }

  const handleLinkManifest = useCallback (async (path: string) => {
    const response = await fetch(path,{
      method:"GET"
    })
    if(response){
      const manifest = await response.json()
      const resource = new ManifestResource(manifest,{defaultLabel:"mmu-default-label", locale:"mmu-default-label", resource: manifest as unknown as IIIFResource, pessimisticAccessControl:false});
      const manifestLabel = resource.getLabel()[0]._value as string;
      await linkManifest({
        url: path,
        rights: ManifestGroupRights.ADMIN,
        idCreator: user.id,
        path: path,
        title: manifestLabel ?
          manifestLabel
          : "new Manifest",
      });
      fetchManifestForUser()
      setModalLinkManifestSIsOpen(!modalLinkManifestIsOpen)
      return toast.success('manifest created')
    }
    return toast.error('manifest could not be created')

  },[fetchManifestForUser, modalLinkManifestIsOpen, user.id, userPersonalGroup])

  const handleSubmitManifestCreationForm = async (manifestThumbnail:string,manifestTitle:string,items:ManifestCreationMedia[]) => {
    try {
      await createManifest({
        manifestMedias : items,
        title: manifestTitle,
        idCreator:user.id,
        manifestThumbnail:manifestThumbnail
      })
      fetchManifestForUser()
      setCreateManifestIsOpen(false)
    } catch (error) {
      console.error("Error processing media", error);
    }
  };

  const handleLookingForUserGroups = async (partialString: string): Promise<UserGroup[]> => {
    if (partialString.length > 0) {
      const linkUserGroups: LinkUserGroup[] = await lookingForUserGroups(partialString);
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

  const handleFiltered = (partialString:string)=>{
    if(partialString.length < 1){
      return setManifestFiltered([])
    }
    if(partialString.length > 0 ){
      const manifetsFiltered = manifests.filter((manifest) =>manifest.title.startsWith(partialString))
      if(manifetsFiltered.length >= 1){
        setManifestFiltered(manifetsFiltered)
      }else{
        setManifestFiltered(undefined)
      }
    }
  }

  const handleUpdateManifest = async (manifestToUpdate: Manifest) => {
    try{
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { rights, ...manifestDto } = manifestToUpdate;
      await updateManifest(manifestDto)
      fetchManifestForUser();
    }catch(error){
      console.error("Error updating Manifest", error);
    }
  }
  const handleDeleteManifest=async (manifestId: number) => {
    await deleteManifest(manifestId)
    setOpenModalManifestId(null)
    fetchManifestForUser()
  }

  const handleGrantAccess = async (manifestId:number) =>{
    if(userToAdd == null){
      toast.error("select an item in the list")
    }
    const linkUserGroupToAdd = userGroupsSearch.find((linkUserGroup)=> linkUserGroup.user_group.id === userToAdd!.id)
    await grantAccessToManifest({ manifestId: manifestId, userGroupId: linkUserGroupToAdd!.user_group.id })
  }

  const getOptionLabel = (option: UserGroup): string => {
    return option.title
  };

  const getGroupByOption=(option:UserGroup):string =>{
    if(option.type === UserGroupTypes.MULTI_USER ){
      return 'Groups'
    }
    else{
      return 'Users'
    }
  }

  const listOfGroup: ListItem[] = useMemo(() => {
    return groupList.map((projectGroup) => ({
      id: projectGroup.user_group.id,
      title: projectGroup.user_group.title,
      rights: projectGroup.rights
    }));
  }, [groupList]);

  const handleChangeRights = async (group: ListItem, eventValue: string, manifestId: number) => {
    await updateAccessToManifest(manifestId, group.id, eventValue as ManifestGroupRights)
  };
  const handleSetOpenSidePanel=()=>{
    setOpenSidePanel(!openSidePanel)
  }
  return (
    <>
      <SidePanelMedia  open={openSidePanel && !!openModalManifestId} setOpen={handleSetOpenSidePanel} display={!!openModalManifestId} fetchMediaForUser={fetchMediaForUser} medias={medias} user={user} userPersonalGroup={userPersonalGroup!}>
        <Grid item container flexDirection="column" spacing={1} sx={{padding:2}}>
          <Grid item container direction="row-reverse" alignItems="center" sx={{position:'sticky', top:0, zIndex:1000, backgroundColor:'#dcdcdc', paddingBottom:"10px"}}>
            {
              !createManifestIsOpen && (
                <>
                  <Grid item>
                    <SortItemSelector<Manifest>
                      sortField={sortField}
                      setSortField={setSortField}
                      fields={["title", "created_at"]}
                    />
                  </Grid>
                <Grid item>
                  <SearchBar
                    fetchFunction={HandleLookingForManifests}
                    getOptionLabel={getOptionLabelForManifestSearchBar}
                    label={t('filterManifest')}
                    setSearchedData={handleSetSearchManifest}
                    setFilter={setManifestFiltered}
                    handleFiltered={handleFiltered}
                  />
                </Grid>
                </>
              )
            }
            <Grid item container spacing={2}>
              {!createManifestIsOpen &&(
                <Grid item sx={{position:'fixed', right:'10px', bottom:'3px', zIndex:999}}>
                  <SpeedDialTooltipOpen actions={actions}/>
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
          {!manifests.length && (
            <Grid
              container
              justifyContent={"center"}
            >
              <Typography variant="h6" component="h2">No manifest yet, click "NEW MANIFEST" to add one.</Typography>
            </Grid>
          )}
          {!searchedManifest && !createManifestIsOpen && manifestFiltered && manifestFiltered.length < 1 &&(
            <Grid item container spacing={1} flexDirection="column" sx={{marginBottom:"70px"}}>
              {currentPageData.map((manifest, index) => (
                <Grid item key={manifest.id}>
                  <MMUCard
                    objectTypes={ObjectTypes.MANIFEST}
                    AddAccessListItemFunction={handleGrantAccess}
                    DefaultButton={<ModalButton tooltipButton={t('tooltipButtonCopy')} onClickFunction={manifest.hash ? ()=>HandleCopyToClipBoard(`${caddyUrl}/${manifest.hash}/${manifest.path}`) : ()=>HandleCopyToClipBoard(manifest.path)} disabled={false} icon={<ContentCopyIcon/>}/>}
                    EditorButton={<ModalButton  tooltipButton={t('tooltipButtonEdit')} onClickFunction={()=>HandleOpenModal(manifest.id)} icon={<ModeEditIcon />} disabled={false}/>}
                    HandleOpenModal={()=>HandleOpenModal(manifest.id)}
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
                    searchBarLabel={t('searchLabel')}
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
          {!searchedManifest && !createManifestIsOpen && manifestFiltered && manifestFiltered.length > 0 &&(
            <Grid item container spacing={1} flexDirection="column" sx={{marginBottom:"70px"}}>
              {manifestFiltered.map((manifest, index) => (
                <Grid item key={manifest.id}>
                  <MMUCard
                    objectTypes={ObjectTypes.MANIFEST}
                    AddAccessListItemFunction={handleGrantAccess}
                    DefaultButton={<ModalButton tooltipButton={t('tooltipButtonCopy')}  onClickFunction={manifest.hash ? ()=>HandleCopyToClipBoard(`${caddyUrl}/${manifest.hash}/${manifest.path}`) : ()=>HandleCopyToClipBoard(manifest.path)} disabled={false} icon={<ContentCopyIcon/>}/>}
                    EditorButton={<ModalButton  tooltipButton={t('tooltipButtonEdit')} onClickFunction={()=>HandleOpenModal(manifest.id)} icon={<ModeEditIcon />} disabled={false}/>}
                    HandleOpenModal={()=>HandleOpenModal(manifest.id)}
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
                    searchBarLabel={t('searchLabel')}
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
          {
            searchedManifest && !createManifestIsOpen &&(
              <Grid item container spacing={1} flexDirection="column" sx={{marginBottom:"70px"}}>
                <Grid item key={searchedManifest.id}>
                  <MMUCard
                    objectTypes={ObjectTypes.MANIFEST}
                    AddAccessListItemFunction={handleGrantAccess}
                    DefaultButton={<ModalButton tooltipButton={t('tooltipButtonCopy')} onClickFunction={searchedManifest.hash ? ()=>HandleCopyToClipBoard(`${caddyUrl}/${searchedManifest.hash}/${searchedManifest.path}`) : ()=>HandleCopyToClipBoard(searchedManifest.path)} disabled={false} icon={<ContentCopyIcon/>}/>}
                    EditorButton={<ModalButton  tooltipButton={t('tooltipButtonEdit')}  onClickFunction={()=>HandleOpenModal(searchedManifest.id)} icon={<ModeEditIcon />} disabled={false}/>}
                    HandleOpenModal={()=>HandleOpenModal(searchedManifest.id)}
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
                    searchBarLabel={t('searchLabel')}
                    searchModalEditItem={handleLookingForUserGroups}
                    setItemToAdd={setUserToAdd}
                    setItemList={setGroupList}
                    thumbnailUrl={thumbnailUrls[searchedManifestIndex!]}
                    updateItem={handleUpdateManifest}
                    handleSelectorChange={handleChangeRights}
                  />
                </Grid>
              </Grid>

            )
          }
          {
            !manifestFiltered && (
              <Grid item container justifyContent="center" alignItems="center">
                <Typography variant="h6" component="h2">There is no manifest matching your filter.</Typography>
              </Grid>
            )
          }
          {
            createManifestIsOpen &&(
              <Grid item container spacing={2} flexDirection="column" sx={{marginBottom:"70px", width: '100%'}}>
                <SidePanelMedia display={true} medias={medias} userPersonalGroup={userPersonalGroup} fetchMediaForUser={fetchMediaForUser} user={user} open={openSidePanel} setOpen={handleSetOpenSidePanel}>
                  <ManifestCreationForm handleSubmit={handleSubmitManifestCreationForm}/>
                </SidePanelMedia>
              </Grid>
            )
          }
          <Grid>
            <DrawerLinkManifest
              linkingManifest={handleLinkManifest}
              modalCreateManifestIsOpen={modalLinkManifestIsOpen}
              toggleModalManifestCreation={()=>setModalLinkManifestSIsOpen(!modalLinkManifestIsOpen)} />
          </Grid>
          {!createManifestIsOpen&&(
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}/>
          )}
        </Grid>
      </SidePanelMedia>
    </>
  )
}
