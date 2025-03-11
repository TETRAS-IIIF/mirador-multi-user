import { useEffect, useState } from "react";
import { manifestOrigin } from "../../features/manifest/types/types.ts";
import placeholder from "../../assets/Placeholder.svg";
import { Dayjs } from "dayjs";
import { mediaOrigin, MediaTypes } from "../../features/media/types/types.ts";

const caddyUrl = import.meta.env.VITE_CADDY_URL;

interface IUseFetchThumbnailsUrlParams {
  item: {
    id: number;
    created_at: Dayjs;
    mediaTypes?: MediaTypes;
    origin?: manifestOrigin | mediaOrigin;
    snapShotHash?: string;
    title?: string;
    share?: string;
    shared?: boolean;
    thumbnailUrl?: string;
    hash?: string;
    path?: string;
  };
}

export default function useFetchThumbnailsUrl({ item }: IUseFetchThumbnailsUrlParams) {
  const [state, setState] = useState<{ url: string; isLoading: boolean }>({
    url: "",
    isLoading: true,
  });

  useEffect(() => {
    const fetchThumbnail = async () => {
      setState({ url: "", isLoading: true });

      if (item.thumbnailUrl) {
        setState({ url: item.thumbnailUrl, isLoading: false });
        return;
      }

      let manifestUrl = "";
      if (item.origin === manifestOrigin.UPLOAD && item.hash && item.title) {
        manifestUrl = `${caddyUrl}/${item.hash}/${item.title}`;
      } else if (item.origin === manifestOrigin.LINK && item.path) {
        manifestUrl = item.path;
      } else if (item.origin === manifestOrigin.CREATE && item.hash && item.path) {
        manifestUrl = `${caddyUrl}/${item.hash}/${item.path}`;
      } else {
        setState({ url: placeholder, isLoading: false });
        return;
      }

      try {
        const response = await fetch(manifestUrl);
        const data = await response.json();

        if (data.thumbnail) {
          setState({ url: data.thumbnail["@id"], isLoading: false });
        } else if (data.items?.[0]?.thumbnail?.[0]?.id) {
          setState({ url: data.items[0].thumbnail[0].id, isLoading: false });
        } else {
          setState({ url: placeholder, isLoading: false });
        }
      } catch (error) {
        console.error("Error fetching manifest:", error);
        setState({ url: placeholder, isLoading: false });
      }
    };

    fetchThumbnail();
  }, [item]);

  return [state.isLoading, state.url];
}
