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
import { ShareLink } from "./shareLink.tsx";
import { ObjectTypes } from "../../features/tag/type.ts";
import { useTranslation } from "react-i18next";

interface IProjectUserGroup<G, T> {
  items: ListItem[];
  children?: (item: ListItem) => ReactNode;
  removeItem: (itemId: number) => void;
  setSearchInput: Dispatch<SetStateAction<string>>;
  handleSearchModalEditItem: (partialString: string) => Promise<any[]> | any[];
  handleGetOptionLabel: (option: G) => string;
  setItemToAdd?: Dispatch<SetStateAction<G | null>>;
  handleAddAccessListItem: () => void;
  searchBarLabel: string;
  getGroupByOption?: (option: any) => string;
  item: T;
  snapShotHash: string;
  objectTypes: ObjectTypes;
  ownerId:number
}

export const ItemList = <
  G extends { title: string },
  T extends { id: number; snapShotHash?: string },
>({
  items,
  children,
  removeItem,
  searchBarLabel,
  handleAddAccessListItem,
  setItemToAdd,
  handleGetOptionLabel,
  handleSearchModalEditItem,
  setSearchInput,
  getGroupByOption,
  item,
  objectTypes,
  ownerId
}: IProjectUserGroup<G, T>): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Grid
      container
      item
      sx={{
        minHeight: "55px",
        height: "400px",
        overflowY: "auto",
      }}
    >
      <Grid container item spacing={2} sx={{ marginTop: "10px" }}>
        {objectTypes === ObjectTypes.PROJECT && (
          <Grid container item alignItems="center" spacing={2}>
            <Grid item>
              <Typography variant="h5">{t("snapshot")}</Typography>
            </Grid>
            <ShareLink
              itemId={item.id}
              snapShotHash={item.snapShotHash ? item.snapShotHash : ""}
            />
          </Grid>
        )}
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
            items.map((item) =>
              item ? (
                <Grid
                  key={item.id}
                  item
                  container
                  spacing={1}
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="spaceBetween"
                >
                  <Grid item container xs={8} alignItems="center" spacing={2} justifyContent="space-between">
                    <Grid item>
                      <Typography>{item.title}</Typography>
                    </Grid>
                  </Grid>
                  <Grid item>
                    {item.type === UserGroupTypes.PERSONAL && <PersonIcon />}
                    {item.type === UserGroupTypes.MULTI_USER && (
                      <GroupsIcon />
                    )}
                    {item.type !== UserGroupTypes.PERSONAL &&
                      item.type !== UserGroupTypes.MULTI_USER && (
                        <PersonIcon />
                      )}
                  </Grid>
                  {(item.personalOwnerGroupId !== ownerId || item.type === UserGroupTypes.MULTI_USER) && <Grid item>{children!(item)}</Grid>}
                  {
                    (item.personalOwnerGroupId !== ownerId || item.type === UserGroupTypes.MULTI_USER) && (
                      <Grid item>
                        <IconButton
                          onClick={() => removeItem(item.id)}
                          aria-label="delete"
                          color="error"
                          disabled={item.personalOwnerGroupId === ownerId && item.type !== UserGroupTypes.MULTI_USER }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    )
                  }
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
    </Grid>
  );
};
