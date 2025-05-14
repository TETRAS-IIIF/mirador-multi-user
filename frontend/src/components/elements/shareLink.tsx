import { Grid } from '@mui/material';
import { SnapShotList } from '../../features/projects/components/SnapShotList.tsx';
import { Snapshot } from '../../features/projects/types/types.ts';

interface IShareLinkProps {
  itemId: number;
  snapShots: Snapshot[];
  updateSnapshot: (
    snapshotTitle: string,
    projectId: number,
    snapshotId: number,
  ) => Promise<void>;
  handleDeleteSnapshot: (snapshotId: number, projectId: number) => void;
  handleCreateSnapshot?: (id: number) => void;
}

export const ShareLink = ({
                            itemId,
                            snapShots,
                            updateSnapshot,
                            handleDeleteSnapshot,
                            handleCreateSnapshot,
                          }: IShareLinkProps) => {
  return (
    <Grid
      container
      item
      spacing={2}
      sx={{ width: '100%', padding: 0, margin: 0 }}
    >
      <Grid
        item
        container
        spacing={1}
        sx={{ width: '100%', padding: 0, margin: 0 }}
      >
        <Grid
          container
          item
          flexDirection="row"
          alignItems="center"
          spacing={2}
          sx={{ width: '100%' }}
        >
          <Grid item sx={{ width: '100%' }}>
            <SnapShotList
              handleCreateSnapshot={handleCreateSnapshot}
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
