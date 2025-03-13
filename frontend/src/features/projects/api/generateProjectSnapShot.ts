import storage from "../../../utils/storage.ts";

interface IdtoProjectSnapshotProps {
  title: string;
  hash: string;
  projectId: number;
}

export const generateSnapshot = async (
  dtoProjectSnapsot: IdtoProjectSnapshotProps,
) => {
  const token = storage.getToken();

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-group-project/snapshot/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dtoProjectSnapsot),
      },
    );
    return await response.json();
  } catch (error) {
    console.error("Error in snapshot generation:", error);
  }
};
