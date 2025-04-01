import { Divider, Grid, IconButton, Typography } from "@mui/material";
import { ListItem } from "../types.ts";
import { LoadingSpinner } from "./loadingSpinner.tsx";
import { Dispatch, ReactNode, SetStateAction } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { SearchBar } from "./SearchBar.tsx";
import { MMUToolTip } from "./MMUTootlTip.tsx";
import { UserGroupTypes } from "../../features/user-group/types/types.ts";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import { ObjectTypes } from "../../features/tag/type.ts";
import { useTranslation } from "react-i18next";
import { Snapshot } from "../../features/projects/types/types.ts";

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
  snapShots: Snapshot[];
}

export const ItemList = <
  G extends { title: string },
  T extends {
    id: number;
    snapshots?: Snapshot[];
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

  const isActionAllowedForListItem = (listItem: ListItem) => {
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
      return item.personalOwnerGroupId !== listItem.personalOwnerGroupId;
    }
  };

  return (
    <Grid
      container
      item
      sx={{
        minHeight: "55px",
        overflowY: "auto",
      }}
    >
      <Grid container item alignItems="center" spacing={2}>
        <Grid item>
          <Typography variant="h5">{t("Permissions")}</Typography>
        </Grid>
        <Grid item>
          <MMUToolTip
            children={
              <div>
                {t("MMUTooltipAdmin")}
                <br />
                {t("MMUTooltipEditor")}
                <br />
                {t("MMUTooltipReader")}
              </div>
            }
          />
        </Grid>
      </Grid>
      <Grid item sx={{ marginLeft: "10px" }}>
        <SearchBar
          label={searchBarLabel}
          handleAdd={handleAddAccessListItem}
          setSelectedData={setItemToAdd!}
          getOptionLabel={handleGetOptionLabel}
          fetchFunction={handleSearchModalEditItem}
          setSearchInput={setSearchInput}
          actionButtonLabel={t("add")}
          groupByOption={getGroupByOption}
        />
      </Grid>
      <Grid item container flexDirection="column" spacing={1}>
        {items &&
          items.map((listItem) =>
            listItem ? (
              <Grid
                key={listItem.id}
                item
                container
                spacing={1}
                flexDirection="row"
                alignItems="center"
                justifyContent="spaceBetween"
              >
                <Grid
                  item
                  container
                  xs={8}
                  alignItems="center"
                  spacing={2}
                  justifyContent="space-between"
                >
                  <Grid item>
                    <Typography>{listItem.title}</Typography>
                  </Grid>
                </Grid>
                <Grid item>
                  {listItem.type === UserGroupTypes.PERSONAL && <PersonIcon />}
                  {listItem.type === UserGroupTypes.MULTI_USER && (
                    <GroupsIcon />
                  )}
                  {listItem.type !== UserGroupTypes.PERSONAL &&
                    listItem.type !== UserGroupTypes.MULTI_USER && (
                      <PersonIcon />
                    )}
                </Grid>
                {isActionAllowedForListItem(listItem) && (
                  <>
                    <Grid item>{children!(listItem)}</Grid>
                    <Grid item>
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
                    </Grid>
                  </>
                )}
                <Grid item xs={12} sx={{ mb: "5px" }}>
                  <Divider />
                </Grid>
              </Grid>
            ) : (
              <LoadingSpinner />
            ),
          )}
      </Grid>
    </Grid>
  );
};
