import { Card, CardActions, SelectChangeEvent, Tooltip, Typography, } from '@mui/material';
import Grid from '@mui/material/Grid';
import { MMUModal } from './modal.tsx';
import { Dispatch, ReactNode, SetStateAction, useCallback, useState, } from 'react';
import { MMUModalEdit } from './MMUModalEdit.tsx';
import { ListItem } from '../types.ts';
import { ItemsRights } from '../../features/user-group/types/types.ts';
import { MediaGroupRights, mediaOrigin, MediaTypes, } from '../../features/media/types/types.ts';
import { ManifestGroupRights, manifestOrigin, } from '../../features/manifest/types/types.ts';
import dayjs, { Dayjs } from 'dayjs';
import { ObjectTypes } from '../../features/tag/type.ts';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import ImageIcon from '@mui/icons-material/Image';
import { useTranslation } from 'react-i18next';
import { ModalConfirmDelete } from '../../features/projects/components/ModalConfirmDelete.tsx';
import { ModalButton } from './ModalButton.tsx';
import CancelIcon from '@mui/icons-material/Cancel';
import ShareIcon from '@mui/icons-material/Share';
import useFetchThumbnailsUrl from '../../utils/customHooks/useFetchThumbnailsUrl.ts';
import { LoadingSpinner } from './loadingSpinner.tsx';
import { Snapshot } from '../../features/projects/types/types.ts';
import LinkIcon from '@mui/icons-material/Link';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CreateIcon from '@mui/icons-material/Create';
import DescriptionIcon from '@mui/icons-material/Description';
import { isValidUrl } from '../../utils/utils.ts';
import placeholder from '../../assets/Placeholder.svg';

interface IMMUCardProps<T, X> {
  id: number;
  rights: ItemsRights | MediaGroupRights | ManifestGroupRights;
  description: string;
  HandleOpenModal: () => void;
  openModal: boolean;
  DefaultButton?: ReactNode;
  EditorButton?: ReactNode;
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
  fetchItems?: () => void;
}

const MMUCard = <
  T extends {
    created_at: Dayjs;
    id: number;
    mediaTypes?: MediaTypes;
    origin?: manifestOrigin | mediaOrigin;
    path?: string;
    share?: string;
    shared?: boolean;
    snapshots?: Snapshot[];
    thumbnailUrl?: string;
    title?: string;
    updated_at: Dayjs;
  },
  X extends { id: number },
>({
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
  ownerId,
  removeAccessListItemFunction,
  rights,
  searchBarLabel,
  searchModalEditItem,
  setItemList,
  setItemToAdd,
  updateItem,
  fetchItems,
}: IMMUCardProps<T, X>) => {
  const [searchInput, setSearchInput] = useState<string>('');
  const [openRemoveItemFromListModal, setOpenRemoveItemFromListModal] =
    useState(false);
  const [isLoading, thumbnailUrl] = useFetchThumbnailsUrl({ item });
  const { t, i18n } = useTranslation();

  const fetchData = useCallback(async () => {
    if (getAccessToItem && setItemList) {
      const list = await getAccessToItem(item.id);
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
    (itemSelected: ListItem) => async (event: SelectChangeEvent<string>) => {
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
    setOpenRemoveItemFromListModal((prev) => !prev);
  };

  return (
    <Card>
      <Grid
        container
        wrap="nowrap"
        justifyContent="space-between"
        sx={{ minHeight: 120 }}
      >
        <Grid
          container
          alignItems="center"
          justifyContent="flex-start"
          spacing={2}
          size={12}
        >
          <Grid size={{ xs: 4, sm: 1 }}>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <img
                src={
                  thumbnailUrl && isValidUrl(thumbnailUrl as string)
                    ? (thumbnailUrl as string)
                    : placeholder
                }
                alt={t('thumbnailMissing')}
                style={{
                  height: 100,
                  width: 100,
                  objectFit: 'contain',
                  marginLeft: 10,
                }}
                loading="lazy"
                decoding="async"
              />
            )}
          </Grid>

          <Grid
            size={{ xs: 1, sm: 1 }}
            display="flex"
            alignItems="center"
            gap={0.5}
          >
            {item.origin === manifestOrigin.LINK && (
              <LinkIcon fontSize="small" />
            )}
            {item.origin === manifestOrigin.UPLOAD && (
              <UploadFileIcon fontSize="small" />
            )}
            {item.origin === manifestOrigin.CREATE && (
              <CreateIcon fontSize="small" />
            )}
            {item.shared && (
              <Tooltip title={t('shared')}>
                <ShareIcon fontSize="small" />
              </Tooltip>
            )}
          </Grid>

          {objectTypes === ObjectTypes.MEDIA &&
            item.mediaTypes === MediaTypes.VIDEO && (
              <Grid size={{ xs: 12, sm: 1 }}>
                <OndemandVideoIcon />
              </Grid>
            )}
          {objectTypes === ObjectTypes.MEDIA &&
            item.mediaTypes === MediaTypes.IMAGE && (
              <Grid size={{ xs: 12, sm: 1 }}>
                <ImageIcon />
              </Grid>
            )}
          {objectTypes === ObjectTypes.MEDIA &&
            item.mediaTypes === MediaTypes.OTHER && (
              <Grid size={{ xs: 12, sm: 1 }}>
                <DescriptionIcon />
              </Grid>
            )}

          <Grid size={{ xs: 4, sm: 3 }}>
            <Tooltip title={itemLabel} placement="bottom-start">
              <Typography
                variant="subtitle1"
                sx={{
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  maxWidth: 400,
                }}
              >
                {itemLabel}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 3, sm: 3 }}>
            <Tooltip title={description}>
              <Typography
                variant="subtitle1"
                sx={{
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  maxWidth: 400,
                }}
              >
                {description}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, sm: 1 }}>
            {item.updated_at && (
              <Tooltip
                title={dayjs(item.updated_at)
                  .locale(i18n.language)
                  .format('LLLL')
                  .toString()}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: 200,
                  }}
                >
                  {dayjs(item.updated_at)
                    .locale(i18n.language)
                    .format('ddd, D MMM')}
                </Typography>
              </Tooltip>
            )}
          </Grid>
        </Grid>

        <Grid alignSelf="center">
          <CardActions sx={{ p: 1 }}>
            <Grid container wrap="nowrap" spacing={1}>
              {Boolean(id) && (
                <Grid display="flex" alignItems="center">
                  {rights === ItemsRights.READER ? (
                    <ModalButton
                      tooltipButton={t('removeProjectFromList')}
                      onClickFunction={handleConfirmRemoveFromListModal}
                      icon={<CancelIcon />}
                      disabled={false}
                    />
                  ) : (
                    EditorButton
                  )}
                </Grid>
              )}
              {DefaultButton && <Grid>{DefaultButton}</Grid>}
            </Grid>
          </CardActions>

          <MMUModal
            width={1000}
            openModal={openModal}
            setOpenModal={HandleOpenModal}
          >
            <MMUModalEdit
              fetchItems={fetchItems}
              objectTypes={objectTypes}
              isGroups={isGroups}
              metadata={metadata || undefined}
              thumbnailUrl={thumbnailUrl as string}
              HandleOpenModalEdit={HandleOpenModal}
              description={description}
              searchBarLabel={searchBarLabel ?? ''}
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
          </MMUModal>
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
          content={t('confirm_remove_item_from_list', {
            itemName: item.title ?? 'item',
          })}
          buttonLabel={t('deleteDefinitely')}
        />
      </MMUModal>
    </Card>
  );
};

export default MMUCard;
