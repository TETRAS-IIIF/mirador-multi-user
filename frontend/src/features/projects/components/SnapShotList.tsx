import { RowData, RowProps, Snapshot } from '../types/types.ts';
import { SnapshotExpendableContent } from './SnapshotExpendableContent.tsx';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import CollapsibleTable from '../../../components/elements/CollapsibleTable.tsx';

interface ISnapShopListProps {
  snapShots: Snapshot[];
  itemId: number;
  updateSnapshot: (
    snapshotTitle: string,
    projectId: number,
    snapshotId: number,
  ) => void;
  handleDeleteSnapshot: (snapshotId: number, projectId: number) => void;
  handleCreateSnapshot?: (id: number) => void;
}

export const SnapShotList = ({
                               snapShots,
                               itemId,
                               updateSnapshot,
                               handleDeleteSnapshot,
                               handleCreateSnapshot,
                             }: ISnapShopListProps) => {
  const { t, i18n } = useTranslation();
  const createRowData = (
    value: string,
    align: 'left' | 'right' | 'center' = 'left',
  ): RowData => ({
    value,
    align,
  });
  const snapshotRows: RowProps[] = snapShots.map((snap, index) => ({
    id: index,
    itemId: itemId,
    data: [
      createRowData(snap.title),
      createRowData(
        dayjs(snap.updated_at).locale(i18n.language).format('LLLL').toString(),
      ),
      createRowData(snap.creator),
    ],
    snapShotHash: snap.hash,
    snapshotId: snap.id,
  }));

  const createColumn = (
    label: string,
    sortKey: string,
    align: 'left' | 'right' | 'center' = 'left',
  ) => ({
    label,
    sortKey,
    align,
  });

  const columns = [
    createColumn(t('title'), t('title')),
    createColumn(t('updated_at'), t('updated_at')),
    createColumn(t('created_by'), t('created_by')),
  ];

  return (
    <>
      <CollapsibleTable
        handleCreateSnapshot={handleCreateSnapshot}
        itemId={itemId}
        columns={columns}
        rows={snapshotRows}
        renderExpandableContent={(row) => (
          <SnapshotExpendableContent
            data={row}
            updateSnapshot={updateSnapshot}
            handleDeleteSnapshot={handleDeleteSnapshot}/>
        )}/>
    </>
  );
};
