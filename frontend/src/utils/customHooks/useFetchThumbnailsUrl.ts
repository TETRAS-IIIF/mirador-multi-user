import { useEffect, useState } from 'react';
import { Dayjs } from 'dayjs';
import placeholder from '../../assets/Placeholder.svg';
import {
  manifestOrigin,
  mediaOrigin,
} from '../../features/manifest/types/types.ts';
import { MediaTypes } from '../../features/media/types/types.ts';

const caddyUrl = import.meta.env.VITE_CADDY_URL;

interface Item {
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
}

interface UseFetchThumbnailsUrlParams {
  item: Item;
}

type UseFetchThumbnailsUrlResult = [isLoading: boolean, url: string];

export default function useFetchThumbnailsUrl({
  item,
}: UseFetchThumbnailsUrlParams): UseFetchThumbnailsUrlResult {
  const [state, setState] = useState<{ url: string; isLoading: boolean }>({
    url: placeholder,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const setSafeState = (next: { url: string; isLoading: boolean }) => {
      if (!cancelled) setState(next);
    };

    const buildManifestUrl = (): string | null => {
      if (item.origin === manifestOrigin.UPLOAD && item.hash && item.title) {
        return `${caddyUrl}/${item.hash}/${item.title}`;
      }
      if (item.origin === manifestOrigin.LINK && item.path) {
        return item.path;
      }
      if (item.origin === manifestOrigin.CREATE && item.hash && item.path) {
        return `${caddyUrl}/${item.hash}/${item.path}`;
      }
      return null;
    };

    const fetchThumbnail = async () => {
      // direct thumbnail on item
      if (item.thumbnailUrl) {
        setSafeState({ url: item.thumbnailUrl, isLoading: false });
        return;
      }

      const manifestUrl = buildManifestUrl();
      if (!manifestUrl) {
        setSafeState({ url: placeholder, isLoading: false });
        return;
      }

      setSafeState({ url: placeholder, isLoading: true });

      try {
        const response = await fetch(manifestUrl);
        if (!response.ok) {
          setSafeState({ url: placeholder, isLoading: false });
          return;
        }

        const data = await response.json();

        // IIIF v2 style: thumbnail: { "@id": "..." }
        const v2Thumb = data?.thumbnail?.['@id'] as string | undefined;

        // IIIF v3 style: items[0].thumbnail[0].id
        const v3Thumb = data?.items?.[0]?.thumbnail?.[0]?.id as
          | string
          | undefined;

        const url = v2Thumb || v3Thumb || placeholder;

        setSafeState({ url, isLoading: false });
      } catch (error) {
        console.error('Error fetching manifest:', error);
        setSafeState({ url: placeholder, isLoading: false });
      }
    };

    fetchThumbnail();

    return () => {
      cancelled = true;
    };
  }, [
    item.id,
    item.origin,
    item.hash,
    item.title,
    item.path,
    item.thumbnailUrl,
  ]);

  return [state.isLoading, state.url];
}
