import { Grid } from "@mui/material";
import { SnapShotList } from "../../features/projects/components/SnapShotList.tsx";
import { Snapshot } from "../../features/projects/types/types.ts";
import { useState } from "react";
import { generateSnapshot } from "../../features/projects/api/generateProjectSnapShot.ts";

interface IShareLinkProps {
  itemId: number;
  snapShots: Snapshot[];
}

export const ShareLink = ({ itemId, snapShots }: IShareLinkProps) => {
  const [snapShotsState, setSnapShotsState] = useState<Snapshot[]>(snapShots); // Store snapshots with updates
  const UpdateSnapshot = async (snapshotId: number) => {
    const snapshotToUpdate = snapShotsState.find(
      (snapShot) => snapshotId === snapShot.id,
    );
    if (snapshotToUpdate) {
      const updatedSnapshots: Snapshot[] = await generateSnapshot({
        title: snapshotToUpdate.title,
        hash: snapshotToUpdate.hash,
        projectId: itemId,
      });
      setSnapShotsState(updatedSnapshots);
    } else {
      throw new Error("unable to update snapshot");
    }
  };

  const handleUpdateSnapshotTitle = async (
    projectId: number,
    snapshotTitle: string,
  ) => {
    setSnapShotsState((prevSnapshots) =>
      prevSnapshots.map((snapshot) =>
        snapshot.project.id === projectId
          ? { ...snapshot, title: snapshotTitle }
          : snapshot,
      ),
    );
  };

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
              snapShots={
                [
                  {
                    title: "dummyTitle",
                    snapShotHash: "randomDummyHash",
                  },
                ] as never[] as Snapshot[]
              }
              itemId={itemId}
              UpdateSnapshot={UpdateSnapshot}
              setSnapshotTitle={handleUpdateSnapshotTitle}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};
