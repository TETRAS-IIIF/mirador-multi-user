import { Card, CardActions, SelectChangeEvent, Tooltip, Typography, } from '@mui/material';
import Grid from '@mui/material/Grid';
import { MMUModal } from './modal.tsx';
import { Dispatch, ReactNode, SetStateAction, useCallback, useState, } from 'react';
import { MMUModalEdit } from './MMUModalEdit.tsx';
import { ITEM_RIGHTS, MEDIA_TYPES, OBJECT_ORIGIN, OBJECT_TYPES, } from '../../utils/mmu_types.ts';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { ModalConfirmDelete } from '../../features/projects/components/ModalConfirmDelete.tsx';
import { ModalButton } from './ModalButton.tsx';
import CancelIcon from '@mui/icons-material/Cancel';
import useFetchThumbnailsUrl from '../../utils/customHooks/useFetchThumbnailsUrl.ts';
import { LoadingSpinner } from './loadingSpinner.tsx';
import { Snapshot } from '../../features/projects/types/types.ts';
import { MMUCardIcon } from './MMUCardIcon.tsx';
import { ListItem } from 'components/types.ts';
import DownloadIcon from '@mui/icons-material/Download';

interface IMMUCardProps<T, X> {
  id: number;
  rights: ITEM_RIGHTS;
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
  objectTypes: OBJECT_TYPES;
  getGroupByOption?: (option: any) => string;
  handleRemoveFromList?: (
    manifestId: number,
    share: string | undefined,
  ) => Promise<void> | void;
  ownerId: number;
  fetchItems?: () => void;
  handleReplaceItem?: (
    file: File,
    itemId: number,
    itemName: string,
    hash: string,
  ) => Promise<void>;
  thumbnailRefreshKey?: number;
}

const MMUCard = <
  T extends {
    created_at: Dayjs;
    id: number;
    mediaTypes?: MEDIA_TYPES;
    origin?: OBJECT_ORIGIN;
    path?: string;
    hash?: string;
    share?: string;
    shared?: boolean;
    snapshots?: Snapshot[];
    thumbnailUrl?: string;
    title?: string;
    updated_at: Dayjs;
    url?: string;
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
  fetchItems,
  getAccessToItem,
  getGroupByOption,
  getOptionLabel,
  handleRemoveFromList,
  handleReplaceItem,
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
  thumbnailRefreshKey,
  updateItem,
}: IMMUCardProps<T, X>) => {
  const [searchInput, setSearchInput] = useState<string>('');
  const [openRemoveItemFromListModal, setOpenRemoveItemFromListModal] =
    useState(false);
  const [isLoading, thumbnailUrl] = useFetchThumbnailsUrl({
    item,
    refreshKey: thumbnailRefreshKey,
  });
  const { t, i18n } = useTranslation();
  const caddyUrl = import.meta.env.VITE_CADDY_URL as string | undefined;

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

  const getDownloadUrl = (): string | undefined => {
    if (item.path && caddyUrl) {
      return `${caddyUrl}/${item.hash}/${item.path}`;
    }
    if (item.path && !caddyUrl) {
      return item.path;
    }
    return item.url;
  };

  const downloadUrl =
    objectTypes === OBJECT_TYPES.MEDIA && item.origin !== OBJECT_ORIGIN.LINK
      ? getDownloadUrl()
      : undefined;

  const getDownloadFilename = (): string => {
    if (item.path) {
      const last = item.path.split('/').pop();
      if (last) return last;
    }
    if (item.title) return item.title;
    return 'media';
  };

  const handleDownloadClick = async (): Promise<void> => {
    if (!downloadUrl) return;

    const response = await fetch(downloadUrl, {});
    if (!response.ok) return;

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = getDownloadFilename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  return (
    <Card>
      <Grid container wrap="nowrap" alignItems="center" sx={{ height: 100 }}>
        <Grid
          container
          alignItems="center"
          wrap="nowrap"
          spacing={1}
          sx={{
            width: '100%',
          }}
        >
          <Grid size={{ xs: 2, sm: 1 }} sx={{ flexShrink: 0 }}>
            {isLoading ? (
              <Grid sx={{ ml: 2 }}>
                <LoadingSpinner />
              </Grid>
            ) : (
              <img
                src={thumbnailUrl}
                alt={t('thumbnailMissing')}
                style={{
                  height: 80,
                  width: 80,
                  objectFit: 'contain',
                  marginLeft: 10,
                }}
                loading="lazy"
                decoding="async"
              />
            )}
          </Grid>

          <Grid
            display="flex"
            alignItems="center"
            gap={0.5}
            sx={{ flexShrink: 0 }}
          >
            <MMUCardIcon item={item} objectTypes={objectTypes} />
          </Grid>

          <Grid size={{ sm: 4 }} sx={{ minWidth: 0 }}>
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

          <Grid size={{ sm: 4 }} sx={{ minWidth: 0 }}>
            <Tooltip title={description}>
              <Typography
                variant="subtitle1"
                sx={{
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  maxWidth: 500,
                }}
              >
                {description}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid
            size={{ xs: 1, sm: 1 }}
            sx={{
              flexShrink: 0,
              flexBasis: 100,
              maxWidth: 100,
              minWidth: 100,
              textAlign: 'right',
            }}
          >
            {item.updated_at && (
              <Tooltip
                title={t('lastEdited', {
                  date: dayjs(item.updated_at)
                    .locale(i18n.language)
                    .format('LLLL'),
                })}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
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

        <Grid
          alignSelf="center"
          sx={{
            ml: 1,
            flexShrink: 0,
            flexBasis: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'end',
          }}
        >
          <CardActions sx={{ p: 2 }}>
            <Grid container wrap="nowrap" spacing={1} alignItems="center">
              {Boolean(id) && (
                <Grid display="flex" alignItems="center">
                  {rights === ITEM_RIGHTS.READER ? (
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
              {downloadUrl && (
                <Grid>
                  <ModalButton
                    tooltipButton={t('downloadMedia')}
                    onClickFunction={handleDownloadClick}
                    disabled={!downloadUrl}
                    icon={<DownloadIcon />}
                  />
                </Grid>
              )}
              {DefaultButton && (
                <Grid display="flex" alignItems="center">
                  {DefaultButton}
                </Grid>
              )}
            </Grid>
          </CardActions>

          <MMUModal
            width={1000}
            openModal={openModal}
            setOpenModal={HandleOpenModal}
          >
            <MMUModalEdit
              HandleOpenModalEdit={HandleOpenModal}
              deleteItem={deleteItem}
              description={description}
              duplicateItem={duplicateItem}
              fetchData={fetchData}
              fetchItems={fetchItems}
              getGroupByOption={getGroupByOption}
              getOptionLabel={getOptionLabel}
              handleAddAccessListItem={handleAddAccessListItem}
              handleDeleteAccessListItem={handleRemoveAccessListItem}
              handleReplaceItem={handleReplaceItem}
              handleSelectorChange={handleChangeSelectedItem}
              isGroups={isGroups}
              item={item}
              itemLabel={itemLabel}
              listOfItem={listOfItem}
              metadata={metadata || undefined}
              objectTypes={objectTypes}
              ownerId={ownerId}
              rights={rights}
              searchBarLabel={searchBarLabel ?? ''}
              searchInput={searchInput}
              searchModalEditItem={searchModalEditItem}
              setItemToAdd={setItemToAdd}
              setSearchInput={setSearchInput}
              thumbnailUrl={thumbnailUrl as string}
              updateItem={updateItem}
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
