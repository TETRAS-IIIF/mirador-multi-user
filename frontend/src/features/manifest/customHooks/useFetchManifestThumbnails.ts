import { useCallback, useState } from "react";
import { Manifest, manifestOrigin } from "../types/types.ts";

const placeholder = "../../../assets/images/placeholder.png";
const caddyUrl = import.meta.env.VITE_CADDY_URL;

export const useFetchThumbnails = (currentPageData: Manifest[]) => {
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchThumbnails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const urls = await Promise.all(
        currentPageData.map(async (manifest: Manifest) => {
          if (manifest.thumbnailUrl) {
            return manifest.thumbnailUrl;
          }

          let manifestUrl = "";
          if (manifest.origin === manifestOrigin.UPLOAD) {
            manifestUrl = `${caddyUrl}/${manifest.hash}/${manifest.title}`;
          } else if (manifest.origin === manifestOrigin.LINK) {
            manifestUrl = manifest.path;
          } else if (manifest.origin === manifestOrigin.CREATE) {
            manifestUrl = `${caddyUrl}/${manifest.hash}/${manifest.path}`;
          } else {
            return placeholder;
          }

          try {
            const manifestResponse = await fetch(manifestUrl);
            const manifestFetched = await manifestResponse.json();
            if (manifestFetched.thumbnail) {
              return manifestFetched.thumbnail["@id"];
            } else if (manifestFetched.items?.[0]?.thumbnail?.[0]?.id) {
              return manifestFetched.items[0].thumbnail[0].id;
            }
          } catch (fetchError) {
            console.error("Error fetching manifest:", fetchError);
          }
          return placeholder;
        }),
      );

      setThumbnailUrls(urls);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [currentPageData]);

  return { thumbnailUrls, fetchThumbnails, loading, error };
};
