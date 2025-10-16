import { ObjectTypes } from '../../features/tag/type.ts';
import { Grid, Typography } from '@mui/material';
import { ShareLink } from './shareLink.tsx';
import { Snapshot } from '../../features/projects/types/types.ts';
import { useTranslation } from 'react-i18next';
import { generateSnapshot } from '../../features/projects/api/snapshot/generateProjectSnapShot.ts';
import { deleteSnapshot } from '../../features/projects/api/snapshot/deleteSnapshot.ts';
import { updateSnapshot } from '../../features/projects/api/snapshot/updateSnapshot.ts';

interface ISnapshotFactoryProps<T> {
  objectTypes: ObjectTypes;
  item: T;
  fetchItems: () => void;
}

export const SnapshotFactory = <
  T extends {
    id: number;
    snapshots?: Snapshot[];
    ownerId?: number;
    personalOwnerGroupId?: number;
  },>({
    objectTypes,
    item,
    fetchItems,
  }: ISnapshotFactoryProps<T>) => {
  const { t } = useTranslation();

  const handleCreateSnapshot = async () => {
    await generateSnapshot({
      title: t('new_snapshot'),
      projectId: item.id,
    });
    fetchItems();
  };

  const handleDeleteSnapshot = async (
    snapshotId: number,
    projectId: number,
  ) => {
    await deleteSnapshot({ snapshotId: snapshotId, projectId: projectId });
    fetchItems();
  };

  const UpdateSnapshot = async (
    title: string,
    projectId: number,
    snapshotId: number,
  ) => {
    await updateSnapshot({
      title: title,
      snapshotId: snapshotId,
      projectId: projectId,
    });
    fetchItems();
  };
  return (
    <>
      {objectTypes === ObjectTypes.PROJECT && (
        <Grid
          alignItems="center"
          container
          flexDirection="column"
         
          spacing={1}
          sx={{ width: '100%', padding: 0, margin: 0 }}>
          <Grid
           
            container
            sx={{
              width: '100%',
              padding: 0,
              margin: 0,
            }}
            spacing={1}>
            <Grid>
              <Typography variant="h5">{t('snapshot')}</Typography>
            </Grid>
          </Grid>
          <Grid
           
            sx={{
              width: '100%',
              margin: 0,
              padding: 0,
            }}>
            <ShareLink
              handleCreateSnapshot={handleCreateSnapshot}
              handleDeleteSnapshot={handleDeleteSnapshot!}
              itemId={item.id}
              snapShots={item.snapshots ? item.snapshots : []}
              updateSnapshot={UpdateSnapshot!}/>
          </Grid>
        </Grid>
      )}
    </>
  );
};
