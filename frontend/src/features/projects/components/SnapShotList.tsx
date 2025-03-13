import { RowData, RowProps, Snapshot } from "../types/types.ts";
import CollapsibleTable from "../../../components/elements/CollapsibleTable.tsx";
import { SnapshotExpendableContent } from "./SnapshotExpendableContent.tsx";

interface ISnapShopListProps {
  snapShots: Snapshot[];
  itemId: number;
  UpdateSnapshot: (snapshotId: number) => void;
  setSnapshotTitle: (projectId: number, title: string) => void;
}

export const SnapShotList = ({
  snapShots,
  itemId,
  UpdateSnapshot,
  setSnapshotTitle,
}: ISnapShopListProps) => {
  const createRowData = (
    value: string,
    align: "left" | "right" | "center" = "left",
  ): RowData => ({
    value,
    align,
  });

  const snapshotRows: RowProps[] = snapShots.map((snap, index) => ({
    id: index,
    itemId: itemId,
    data: [createRowData(snap.title)],
    snapShotHash: snap.hash,
  }));

  const createColumn = (
    label: string,
    sortKey: string,
    align: "left" | "right" | "center" = "left",
  ) => ({
    label,
    sortKey,
    align,
  });

  const columns = [createColumn("Title", "title")];

  return (
    <>
      <CollapsibleTable
        columns={columns}
        rows={snapshotRows}
        renderExpandableContent={(row) => (
          <SnapshotExpendableContent
            data={row}
            UpdateSnapshot={UpdateSnapshot}
            setSnapshotTitle={setSnapshotTitle}
          />
        )}
      />
    </>
  );
};
