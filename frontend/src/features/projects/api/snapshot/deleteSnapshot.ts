import storage from "../../../../utils/storage.ts";

interface IdtoDeleteSnapshotProps {
  snapshotId: number;
  projectId: number;
}

export const deleteSnapshot = async (
  dtoDeleteSnapshot: IdtoDeleteSnapshotProps,
) => {
  const token = storage.getToken();

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-group-project/snapshot/delete/${dtoDeleteSnapshot.snapshotId}/${dtoDeleteSnapshot.projectId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete snapshot: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in snapshot removal:", error);
  }
};
