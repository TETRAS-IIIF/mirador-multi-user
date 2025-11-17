import {
  Card,
  CardActions,
  SelectChangeEvent,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { MMUModal } from './modal.tsx';
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useState,
} from 'react';
import { MMUModalEdit } from './MMUModalEdit.tsx';
import {
  ITEM_RIGHTS,
  MEDIA_TYPES,
  OBJECT_ORIGIN,
  OBJECT_TYPES,
} from '../../utils/mmu_types.ts';

import dayjs, { Dayjs } from 'dayjs';

import { useTranslation } from 'react-i18next';
import { ModalConfirmDelete } from '../../features/projects/components/ModalConfirmDelete.tsx';
import { ModalButton } from './ModalButton.tsx';
import CancelIcon from '@mui/icons-material/Cancel';

import useFetchThumbnailsUrl from '../../utils/customHooks/useFetchThumbnailsUrl.ts';
import { LoadingSpinner } from './loadingSpinner.tsx';
import { Snapshot } from '../../features/projects/types/types.ts';

import { isValidUrl } from '../../utils/utils.ts';
import placeholder from '../../assets/Placeholder.svg';
import { MMUCardIcon } from './MMUCardIcon.tsx';
import { ListItem } from 'components/types.ts';

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
}

const MMUCard = <
  T extends {
    created_at: Dayjs;
    id: number;
    mediaTypes?: MEDIA_TYPES;
    origin?: OBJECT_ORIGIN;
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

  const thumbnailSrc = isValidUrl(thumbnailUrl) ? thumbnailUrl : placeholder;

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
      <Grid container wrap="nowrap" alignItems="center" sx={{ height: 100 }}>
        <Grid
          container
          alignItems="center"
          wrap="nowrap"
          spacing={1}
          size={12}
          sx={{ flex: 1, minWidth: 0 }}
        >
          <Grid size={{ xs: 4, sm: 1 }}>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <img
                src={thumbnailSrc}
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
            size={{ xs: 3, sm: 2 }}
            display="flex"
            alignItems="center"
            gap={0.5}
          >
            <MMUCardIcon item={item} objectTypes={objectTypes} />
          </Grid>

          <Grid size={{ xs: 5, sm: 3 }}>
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

          <Grid size={{ xs: 3, sm: 5 }}>
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

          <Grid>
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
                    maxWidth: 100,
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

        <Grid alignSelf="center" sx={{ ml: 1 }}>
          <CardActions sx={{ p: 2 }}>
            <Grid container wrap="nowrap" spacing={1}>
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
