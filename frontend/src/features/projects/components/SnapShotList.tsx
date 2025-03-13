import { RowData, RowProps, SnapShot } from "../types/types.ts";
import CollapsibleTable from "../../../components/elements/CollapsibleTable.tsx";
import { SnapshotExpendableContent } from "./SnapshotExpendableContent.tsx";

interface ISnapShopListProps {
  snapShots: SnapShot[];
  handleCopyToClipboard: () => void;
  itemId: number;
}

export const SnapShotList = ({ snapShots, itemId }: ISnapShopListProps) => {
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
    snapShotHash: snap.snapShotHash,
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
        renderExpandableContent={SnapshotExpendableContent}
      />
    </>
  );
};
