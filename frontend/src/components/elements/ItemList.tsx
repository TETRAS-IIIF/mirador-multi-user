import { Box, Divider, Grid, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import { Dispatch, ReactNode, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import { ListItem } from '../types.ts';
import { LoadingSpinner } from './loadingSpinner.tsx';
import { SearchBar } from './SearchBar.tsx';
import { MMUToolTip } from './MMUTootlTip.tsx';
import { UserGroupTypes } from '../../features/user-group/types/types.ts';
import { ObjectTypes } from '../../features/tag/type.ts';

interface IProjectUserGroup<G, T> {
  children?: (item: ListItem) => ReactNode;
  getGroupByOption?: (option: any) => string;
  handleAddAccessListItem: () => void;
  handleGetOptionLabel: (option: { title: string }) => string;
  handleSearchModalEditItem: (partialString: string) => Promise<any[]> | any[];
  item: T;
  items: ListItem[];
  objectTypes: ObjectTypes;
  ownerId: number;
  removeItem: (itemId: number) => void;
  searchBarLabel: string;
  setItemToAdd?: Dispatch<SetStateAction<G | null>>;
  setSearchInput: Dispatch<SetStateAction<string>>;
}

export const ItemList = <
  G extends { title: string },
  T extends {
    id: number;
    ownerId?: number;
    personalOwnerGroupId?: number;
  },
>({
  children,
  getGroupByOption,
  handleAddAccessListItem,
  handleGetOptionLabel,
  handleSearchModalEditItem,
  item,
  items,
  objectTypes,
  ownerId,
  removeItem,
  searchBarLabel,
  setItemToAdd,
  setSearchInput,
}: IProjectUserGroup<G, T>) => {
  const { t } = useTranslation();

  const isActionAllowedForListItem = (listItem: ListItem): boolean => {
    if (
      objectTypes === ObjectTypes.MANIFEST ||
      objectTypes === ObjectTypes.MEDIA
    ) {
      return (
        listItem.personalOwnerGroupId !== ownerId ||
        listItem.type === UserGroupTypes.MULTI_USER
      );
    }
    if (objectTypes === ObjectTypes.GROUP) {
      return item.ownerId !== listItem.id;
    }
    if (objectTypes === ObjectTypes.PROJECT) {
      return item.personalOwnerGroupId !== listItem.id;
    }
    return false;
  };

  const renderIcon = (type: UserGroupTypes) => {
    if (type === UserGroupTypes.PERSONAL) return <PersonIcon />;
    if (type === UserGroupTypes.MULTI_USER) return <GroupsIcon />;
    return <PersonIcon />;
  };

  return (
    <Grid
      container
      direction="column"
      spacing={2}
      sx={{
        overflowY: 'auto',
        minWidth: 935,
      }}
    >
      <Grid>
        <Typography variant="h5">{t('Permissions')}</Typography>
        <MMUToolTip>
          <div>
            {t('MMUTooltipAdmin')}
            <br />
            {t('MMUTooltipEditor')}
            <br />
            {t('MMUTooltipReader')}
          </div>
        </MMUToolTip>
      </Grid>

      <Grid>
        <SearchBar
          label={searchBarLabel}
          handleAdd={handleAddAccessListItem}
          setSelectedData={setItemToAdd!}
          getOptionLabel={handleGetOptionLabel}
          fetchFunction={handleSearchModalEditItem}
          setSearchInput={setSearchInput}
          actionButtonLabel={t('add')}
          groupByOption={getGroupByOption}
        />
      </Grid>

      <Grid>
        <MMUToolTip>
          <div>{t('MMUTooltipSearchForUser')}</div>
        </MMUToolTip>
      </Grid>

      <Grid container direction="column" spacing={1}>
        {items?.map((listItem) =>
          listItem ? (
            <Grid
              key={listItem.id}
              container
              alignItems="center"
              justifyContent="space-between"
              sx={{ width: '100%' }}
            >
              <Typography>{listItem.title}</Typography>

              <Box display="flex" alignItems="center" gap={1}>
                {renderIcon(listItem.type!)}
                {isActionAllowedForListItem(listItem) ? (
                  <>
                    {children && children(listItem)}
                    <IconButton
                      onClick={() => removeItem(listItem.id)}
                      aria-label="delete"
                      color="error"
                      disabled={
                        listItem.personalOwnerGroupId === ownerId &&
                        listItem.type !== UserGroupTypes.MULTI_USER
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                ) : (
                  <>
                    {children && (
                      <Box sx={{ visibility: 'hidden' }}>
                        {children(listItem)}
                      </Box>
                    )}
                    <IconButton sx={{ visibility: 'hidden' }}>
                      <DeleteIcon />
                    </IconButton>
                  </>
                )}
              </Box>

              <Divider sx={{ my: 1, width: '100%' }} />
            </Grid>
          ) : (
            <LoadingSpinner key={`spinner-${Math.random()}`} />
          ),
        )}
      </Grid>
    </Grid>
  );
};
