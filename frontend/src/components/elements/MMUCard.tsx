import {
  Card,
  CardActions,
  Grid,
  SelectChangeEvent,
  Tooltip,
  Typography,
} from "@mui/material";
import { MMUModal } from "./modal.tsx";
import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useCallback,
  useState,
} from "react";
import { MMUModalEdit } from "./MMUModalEdit.tsx";
import { ListItem } from "../types.ts";
import { ItemsRights } from "../../features/user-group/types/types.ts";
import {
  MediaGroupRights,
  mediaOrigin,
  MediaTypes,
} from "../../features/media/types/types.ts";
import {
  ManifestGroupRights,
  manifestOrigin,
} from "../../features/manifest/types/types.ts";
import dayjs, { Dayjs } from "dayjs";
import { ObjectTypes } from "../../features/tag/type.ts";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import ImageIcon from "@mui/icons-material/Image";
import { useTranslation } from "react-i18next";
import { ModalConfirmDelete } from "../../features/projects/components/ModalConfirmDelete.tsx";
import { ModalButton } from "./ModalButton.tsx";
import CancelIcon from "@mui/icons-material/Cancel";
import ShareIcon from "@mui/icons-material/Share";
import useFetchThumbnailsUrl from "../../utils/customHooks/useFetchThumbnailsUrl.ts";
import { LoadingSpinner } from "./loadingSpinner.tsx";

interface IMMUCardProps<T, X> {
  id: number;
  rights: ItemsRights | MediaGroupRights | ManifestGroupRights;
  description: string;
  HandleOpenModal: () => void;
  openModal: boolean;
  DefaultButton?: ReactElement;
  EditorButton?: ReactElement;
  itemLabel: string;
  handleSelectorChange?: (
    itemList: ListItem,
    eventValue: string,
    itemId: number,
    owner: any,
  ) => Promise<void>;
  listOfItem?: ListItem[];
  deleteItem?: (itemId: number) => void;
  duplicateItem?: (itemId: number) => void;
  getOptionLabel?: (option: any, searchInput: string) => string;
  AddAccessListItemFunction?: (itemId: number) => Promise<void>;
  item: T;
  searchModalEditItem?: (partialString: string) => Promise<any[]> | any[];
  setItemToAdd?: Dispatch<SetStateAction<any>>;
  updateItem?: (item: T) => void;
  getAccessToItem?: (itemId: number) => Promise<any>;
  removeAccessListItemFunction?: (
    itemId: number,
    accessItemId: number,
  ) => Promise<void>;
  setItemList?: Dispatch<SetStateAction<X[]>>;
  searchBarLabel?: string;
  thumbnailUrl?: string | null;
  metadata?: Record<string, string>;
  isGroups?: boolean;
  objectTypes: ObjectTypes;
  getGroupByOption?: (option: any) => string;
  handleRemoveFromList?: (
    manifestId: number,
    share: string | undefined,
  ) => Promise<void> | void;
  ownerId: number;
}

const MMUCard = <
  T extends {
    created_at: Dayjs;
    hash?: string;
    id: number;
    mediaTypes?: MediaTypes;
    origin?: manifestOrigin | mediaOrigin;
    path?: string;
    share?: string;
    shared?: boolean;
    snapShotHash?: string;
    thumbnailUrl?: string;
    title?: string;
    updated_at: Dayjs;
  },
  X extends { id: number },
>({
  ownerId,
  AddAccessListItemFunction,
  DefaultButton,
  EditorButton,
  HandleOpenModal,
  deleteItem,
  description,
  duplicateItem,
  getAccessToItem,
  getGroupByOption,
  getOptionLabel,
  handleRemoveFromList,
  handleSelectorChange,
  id,
  isGroups,
  item,
  itemLabel,
  listOfItem,
  metadata,
  objectTypes,
  openModal,
  removeAccessListItemFunction,
  rights,
  searchBarLabel,
  searchModalEditItem,
  setItemList,
  setItemToAdd,
  updateItem,
}: IMMUCardProps<T, X>) => {
  const [searchInput, setSearchInput] = useState<string>("");
  const [openRemoveItemFromListModal, setOpenRemoveItemFromListModal] =
    useState(false);
  const [isLoading, thumbnailUrl] = useFetchThumbnailsUrl({ item });
  const { t, i18n } = useTranslation();

  const fetchData = useCallback(async () => {
    let list;
    if (getAccessToItem && setItemList) {
      list = await getAccessToItem(item.id);
      setItemList(list);
    }
  }, [getAccessToItem, item.id, setItemList]);

  const handleRemoveAccessListItem = async (accessItemId: number) => {
    if (removeAccessListItemFunction) {
      await removeAccessListItemFunction(item.id, accessItemId);
    }
    fetchData();
  };

  const handleAddAccessListItem = async () => {
    if (AddAccessListItemFunction) {
      await AddAccessListItemFunction(item.id);
    }
    fetchData();
  };


  const handleChangeSelectedItem =
    (itemSelected: ListItem) => async (event: SelectChangeEvent) => {
      if (handleSelectorChange) {
        await handleSelectorChange(
          itemSelected,
          event.target.value,
          item.id,
          item,
        );
      }
    };
  const handleConfirmRemoveFromListModal = () => {
    setOpenRemoveItemFromListModal(!openRemoveItemFromListModal);
  };
console.log("item",item)
  return (
    <Card>
      <Grid
        container
        item
        flexDirection="row"
        wrap="nowrap"
        justifyContent="space-between"
        sx={{ minHeight: "120px" }}
      >
        <Grid
          item
          container
          flexDirection="row"
          alignItems="center"
          justifyContent="flex-start"
          spacing={2}
        >
          <Grid item xs={12} sm={4}>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <img
                src={thumbnailUrl as string}
                alt={t("thumbnailMissing")}
                style={{
                  height: 100,
                  width: 150,
                  objectFit: "contain",
                  marginLeft: "10px",
                }}
              />
            )}
          </Grid>
          <Grid item xs={12} sm={1}>
            {item.shared && (
              <Tooltip title={t("shared")}>
                <ShareIcon />
              </Tooltip>
            )}
          </Grid>
          {objectTypes === ObjectTypes.MEDIA &&
            item.mediaTypes === MediaTypes.VIDEO && (
              <Grid item xs={12} sm={1}>
                <OndemandVideoIcon />
              </Grid>
            )}
          {objectTypes === ObjectTypes.MEDIA &&
            item.mediaTypes === MediaTypes.IMAGE && (
              <Grid item xs={12} sm={1}>
                <ImageIcon />
              </Grid>
            )}
          <Grid item xs={12} sm={2}>
            <Tooltip title={itemLabel} placement="bottom-start">
              <Typography
                variant="subtitle1"
                sx={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  maxWidth: "200px",
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
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  maxWidth: "200px",
                }}
              >
                {description}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={1}>
            {item.updated_at && (
              <Tooltip
                title={dayjs(item.updated_at)
                  .locale(i18n.language)
                  .format("LLLL")
                  .toString()}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    maxWidth: "200px",
                  }}
                >
                  {dayjs(item.updated_at)
                    .locale(i18n.language)
                    .format("ddd, D MMM")}
                </Typography>
              </Tooltip>
            )}
          </Grid>
        </Grid>
        <Grid item alignSelf="center">
          <CardActions sx={{ padding: 1 }}>
            <Grid container flexDirection="row" wrap="nowrap" spacing={1}>
              {id && (
                <Grid item alignContent={"center"}>
                  {rights === ItemsRights.READER ? (
                    <ModalButton
                      tooltipButton={t("removeProjectFromList")}
                      onClickFunction={handleConfirmRemoveFromListModal}
                      icon={<CancelIcon />}
                      disabled={false}
                    />
                  ) : (
                    EditorButton
                  )}
                </Grid>
              )}
              {DefaultButton && <Grid item>{DefaultButton}</Grid>}
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
                  metadata={metadata ? metadata : undefined}
                  thumbnailUrl={thumbnailUrl as string}
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
                  duplicateItem={duplicateItem}
                  ownerId={ownerId}
                />
              </>
            }
          />
        </Grid>
      </Grid>
      <MMUModal
        width={400}
        openModal={openRemoveItemFromListModal}
        setOpenModal={handleConfirmRemoveFromListModal}
      >
        <ModalConfirmDelete
          deleteItem={handleRemoveFromList!}
          itemId={item.id}
          share={item.share}
          content={t("confirm_remove_item_from_list", {
            itemName: item.title ? item.title : "item",
          })}
          buttonLabel={t("deleteDefinitely")}
        />
      </MMUModal>
    </Card>
  );
};

export default MMUCard;
