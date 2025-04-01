import { ObjectTypes } from "../../features/tag/type.ts";
import { Grid, Typography } from "@mui/material";
import { ShareLink } from "./shareLink.tsx";
import { Snapshot } from "../../features/projects/types/types.ts";
import { useTranslation } from "react-i18next";

interface ISnapshotFactoryProps<T> {
  objectTypes: ObjectTypes;
  handleCreateSnapshot?: (projectId: number) => void;
  handleDeleteSnapshot?: (snapshotId: number, projectId: number) => void;
  updateSnapshot?: (
    snapshotTitle: string,
    projectId: number,
    snapshotId: number,
  ) => void;
  item: T;
}

export const SnapshotFactory = <
  T extends {
    id: number;
    snapshots?: Snapshot[];
    ownerId?: number;
    personalOwnerGroupId?: number;
  },
>({
  objectTypes,
  handleCreateSnapshot,
  handleDeleteSnapshot,
  updateSnapshot,
  item,
}: ISnapshotFactoryProps<T>) => {
  const { t } = useTranslation();

  return (
    <>
      {objectTypes === ObjectTypes.PROJECT && (
        <Grid
          alignItems="center"
          container
          flexDirection="column"
          item
          spacing={1}
          sx={{ width: "100%", padding: 0, margin: 0 }}
        >
          <Grid
            item
            container
            sx={{
              width: "100%",
              padding: 0,
              margin: 0,
            }}
            spacing={1}
          >
            <Grid item>
              <Typography variant="h5">{t("snapshot")}</Typography>
            </Grid>
          </Grid>
          <Grid
            item
            sx={{
              width: "100%",
              margin: 0,
              padding: 0,
            }}
          >
            <ShareLink
              handleCreateSnapshot={handleCreateSnapshot}
              handleDeleteSnapshot={handleDeleteSnapshot!}
              itemId={item.id}
              snapShots={item.snapshots ? item.snapshots : []}
              updateSnapshot={updateSnapshot!}
            />
          </Grid>
        </Grid>
      )}
    </>
  );
};
