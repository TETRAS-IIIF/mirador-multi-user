import storage from "../../../utils/storage.ts";

interface IdtoProjectSnapshotProps {
  title: string;
  hash?: string;
  projectId: number;
}

export const generateSnapshot = async (
  dtoProjectSnapshot: IdtoProjectSnapshotProps,
) => {
  const token = storage.getToken();

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-group-project/snapshot/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...dtoProjectSnapshot,
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
