import { RowData, RowProps, Snapshot } from "../types/types.ts";
import CollapsibleTable from "../../../components/elements/CollapsibleTable.tsx";
import { SnapshotExpendableContent } from "./SnapshotExpendableContent.tsx";

interface ISnapShopListProps {
  snapShots: Snapshot[];
  itemId: number;
  updateSnapshot: (
    snapshotTitle: string,
    projectId: number,
    snapshotId: number,
  ) => void;
  handleDeleteSnapshot: (snapshotId: number, projectId: number) => void;
}

export const SnapShotList = ({
  snapShots,
  itemId,
  updateSnapshot,
  handleDeleteSnapshot,
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
    snapshotId: snap.id,
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
            updateSnapshot={updateSnapshot}
            handleDeleteSnapshot={handleDeleteSnapshot}
          />
        )}
      />
    </>
  );
};
