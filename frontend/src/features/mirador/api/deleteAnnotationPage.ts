import storage from "../../../utils/storage.ts";

export const deleteAnnotationPage = async (
  annotationPageId: string,
  projectId: number,
) => {
  try {
    const token = storage.getToken();
    const encodedURI = encodeURIComponent(annotationPageId);
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/annotation-page/${encodedURI}/${projectId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error(`Error: ${response.status} - ${response.statusText}`);
      console.error("Error details:", errorDetails);
      throw new Error("Failed to delete annotation page");
    }

    const responseJson = await response.json();
    return responseJson;
  } catch (error) {
    console.error("Error in deleteAnnotationPage:", error);
    throw error;
  }
};
