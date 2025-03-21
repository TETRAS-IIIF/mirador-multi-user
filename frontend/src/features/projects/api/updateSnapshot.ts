import storage from "../../../utils/storage.ts";

interface IdtoUpdateSnapshotProps {
  title: string;
  snapshotId: number;
  projectId: number;
}

export const updateSnapshot = async (
  dtoUpdateSnapshot: IdtoUpdateSnapshotProps,
) => {
  const token = storage.getToken();

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-group-project/snapshot/update`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...dtoUpdateSnapshot,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to generate snapshot: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in snapshot generation:", error);
  }
};
