import { Grid } from "@mui/material";
import { SnapShotList } from "../../features/projects/components/SnapShotList.tsx";
import { Snapshot } from "../../features/projects/types/types.ts";

interface IShareLinkProps {
  itemId: number;
  snapShots: Snapshot[];
  updateSnapshot: (
    snapshotTitle: string,
    projectId: number,
    snapshotId: number,
  ) => void;
  handleDeleteSnapshot: (snapshotId: number, projectId: number) => void;
}

export const ShareLink = ({
  itemId,
  snapShots,
  updateSnapshot,
  handleDeleteSnapshot,
}: IShareLinkProps) => {
  return (
    <Grid container item spacing={2} sx={{ width: "100%" }}>
      <Grid item container xs={10} spacing={2} sx={{ width: "100%" }}>
        <Grid
          container
          item
          flexDirection="row"
          alignItems="center"
          spacing={2}
          sx={{ width: "100%" }}
        >
          <Grid item sx={{ width: "100%" }}>
            <SnapShotList
              handleDeleteSnapshot={handleDeleteSnapshot}
              snapShots={snapShots}
              itemId={itemId}
              updateSnapshot={updateSnapshot}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};
