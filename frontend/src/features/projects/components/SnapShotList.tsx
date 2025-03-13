import { RowData, RowProps, SnapShot } from "../types/types.ts";
import CollapsibleTable from "../../../components/elements/CollapsibleTable.tsx";
import { SnapshotExpendableContent } from "./SnapshotExpendableContent.tsx";

interface ISnapShopListProps {
  snapShots: SnapShot[];
  handleCopyToClipboard: () => void;
  itemId: number;
}

export const SnapShotList = ({
  snapShots,
  handleCopyToClipboard,
  itemId,
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
    data: [createRowData(snap.title), createRowData(snap.snapShotHash)],
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

  const columns = [
    createColumn("Title", "title"),
    createColumn("Hash", "snapShotHash"),
  ];

  return (
    <>
      <CollapsibleTable
        labelButton={"Link To Snap Shot"}
        columns={columns}
        rows={snapshotRows}
        onActionClick={handleCopyToClipboard}
        renderExpandableContent={SnapshotExpendableContent}
      />
    </>
  );
};
