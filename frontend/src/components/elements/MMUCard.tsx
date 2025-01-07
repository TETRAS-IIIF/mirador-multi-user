import { Card, Grid, Typography, CardActions, Tooltip, SelectChangeEvent } from "@mui/material";
import { MMUModal } from "./modal.tsx";
import { Dispatch, ReactElement, SetStateAction, useCallback, useState } from "react";
import { MMUModalEdit } from "./MMUModalEdit.tsx";
import { ListItem } from "../types.ts";
import { ItemsRights } from "../../features/user-group/types/types.ts";
import { MediaGroupRights, mediaOrigin, MediaTypes } from "../../features/media/types/types.ts";
import { ManifestGroupRights, manifestOrigin } from "../../features/manifest/types/types.ts";
import dayjs, { Dayjs } from "dayjs";
import { ObjectTypes } from "../../features/tag/type.ts";
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import ImageIcon from '@mui/icons-material/Image';
import { useTranslation } from "react-i18next";
import placeholder from "../../assets/Placeholder.svg";


interface IMMUCardProps<T,G,X> {
  id: number;
  rights: ItemsRights | MediaGroupRights | ManifestGroupRights;
  description: string;
  HandleOpenModal: () => void;
  openModal: boolean;
  DefaultButton?: ReactElement;
  ReaderButton?: ReactElement;
  EditorButton?: ReactElement;
  itemLabel:string;
  handleSelectorChange?: (itemList: ListItem, eventValue : string, itemId:number, owner :any ) => Promise<void>,
  listOfItem?: ListItem[],
  deleteItem?: (itemId: number) => void,
  duplicateItem?: (itemId: number) => void,
  getOptionLabel?: (option: any, searchInput: string) => string,
  AddAccessListItemFunction?: (itemId: number ) => Promise<void>,
  item : T,
  searchModalEditItem?:(partialString:string)=>Promise<any[]> | any[]
  setItemToAdd?: Dispatch<SetStateAction<G | null>>,
  updateItem?: (item: T) => void,
  getAccessToItem?:(itemId:number)=> Promise<any>
  removeAccessListItemFunction?:(itemId:number, accessItemId:number )=>Promise<void>
  setItemList?:Dispatch<SetStateAction<X[]>>
  searchBarLabel?:string
  thumbnailUrl?:string | null
  metadata?: Record<string, string>;
  isGroups?:boolean
  objectTypes:ObjectTypes
  getGroupByOption?:(option:any)=>string
}

const MMUCard = <T extends { id: number, created_at:Dayjs,snapShotHash?:string ,mediaTypes?:MediaTypes,  origin?: manifestOrigin | mediaOrigin;},G, X extends { id:number} > (
  {
    id,
    rights,
    description,
    HandleOpenModal,
    openModal,
    DefaultButton,
    ReaderButton,
    EditorButton,
    itemLabel,
    handleSelectorChange,
    getAccessToItem,
    listOfItem,
    deleteItem,
    getOptionLabel,
    AddAccessListItemFunction,
    item,
    updateItem,
    setItemToAdd,
    searchModalEditItem,
    removeAccessListItemFunction,
    setItemList,
    searchBarLabel,
    thumbnailUrl,
    metadata,
    isGroups,
    objectTypes,
    getGroupByOption,
    duplicateItem
  }:IMMUCardProps<T,G, X>
) => {
  const [searchInput, setSearchInput] = useState<string>('');
  const { t } = useTranslation();
  const handleRemoveAccessListItem = async ( accessItemId : number) =>{
    if (removeAccessListItemFunction) {
      await removeAccessListItemFunction(item.id, accessItemId);
    }
    fetchData();
  }


  const handleAddAccessListItem = async () =>{
    if (AddAccessListItemFunction) {
      await AddAccessListItemFunction(item.id);
    }
    fetchData();
  }


  const fetchData = useCallback(async () => {
    let list;
    if (getAccessToItem && setItemList) {
      list = await getAccessToItem(item.id);
      setItemList(list);
    }
  }, [getAccessToItem, item.id, setItemList]);

  const handleChangeSelectedItem = (itemSelected: ListItem) => async (event: SelectChangeEvent) => {

    if (handleSelectorChange) {
      await handleSelectorChange(itemSelected, event.target.value, item.id, item);
    }
  }

  return (
    <Card>
      <Grid container item flexDirection="row" wrap="nowrap" justifyContent="space-between" sx={{ minHeight: '120px' }}>
        <Grid item container flexDirection="row" alignItems="center" justifyContent="flex-start" spacing={2}>
          <Grid item xs={12} sm={4}>
            <img
              src={thumbnailUrl ? thumbnailUrl : placeholder}
              alt="cardImage"
              style={{ height: 100, width: 150, objectFit: "contain", marginLeft: "10px" }}
            />
          </Grid>

          {(objectTypes === ObjectTypes.MEDIA && item.mediaTypes === MediaTypes.VIDEO )&& (<Grid item xs={12} sm={1}><OndemandVideoIcon /></Grid>)}
          {(objectTypes === ObjectTypes.MEDIA && item.mediaTypes === MediaTypes.IMAGE )&&( <Grid item xs={12} sm={1}><ImageIcon /></Grid>)}
          <Grid item xs={12} sm={2}>
            <Tooltip title={itemLabel} placement="bottom-start">
              <Typography
                variant="subtitle1"
                sx={{
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  maxWidth: '200px',
                }}
              >
                {itemLabel}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Tooltip title={description}>
              <Typography
                variant="subtitle1"
                sx={{
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  maxWidth: '200px',
                }}
              >
                {description}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={1}>
            {
              item.created_at &&(
                <Tooltip title={item.created_at.toString()}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      maxWidth: '200px',
                    }}
                  >
                    {dayjs(item.created_at).format('ddd, D MMM')}
                  </Typography>
                </Tooltip>
              )
            }
          </Grid>
        </Grid>
        <Grid item alignSelf="center">
          <CardActions sx={{ padding: 1 }}>
            <Grid container flexDirection="row" wrap="nowrap" spacing={2}>
              {id && (
                <Grid item>
                  {rights === ItemsRights.READER ? ReaderButton : EditorButton}
                </Grid>
              )}
              {DefaultButton && (
                <Grid item>
                  <Tooltip title={t('openProject')}>
                    {DefaultButton}
                  </Tooltip>
                </Grid>
              )}
            </Grid>
          </CardActions>
            <MMUModal
              width={800}
              openModal={openModal}
              setOpenModal={HandleOpenModal}
              children={
                <>
                  <MMUModalEdit
                    objectTypes={objectTypes}
                    isGroups={isGroups}
                    metadata={metadata?metadata:undefined}
                    thumbnailUrl={thumbnailUrl}
                    HandleOpenModalEdit={HandleOpenModal}
                    description={description}
                    searchBarLabel={searchBarLabel ? searchBarLabel : ""}
                    itemLabel={itemLabel}
                    handleSelectorChange={handleChangeSelectedItem}
                    fetchData={fetchData}
                    listOfItem={listOfItem}
                    deleteItem={deleteItem}
                    getOptionLabel={getOptionLabel}
                    getGroupByOption={getGroupByOption}
                    setSearchInput={setSearchInput}
                    handleAddAccessListItem={handleAddAccessListItem}
                    item={item}
                    searchInput={searchInput}
                    searchModalEditItem={searchModalEditItem}
                    setItemToAdd={setItemToAdd}
                    updateItem={updateItem}
                    rights={rights}
                    handleDeleteAccessListItem={handleRemoveAccessListItem}
                   duplicateItem={duplicateItem}/>
                </>
              }/>
        </Grid>
      </Grid>
    </Card>
  );
};

export default MMUCard;
