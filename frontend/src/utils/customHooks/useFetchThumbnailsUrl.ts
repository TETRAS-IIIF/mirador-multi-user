import { useEffect, useState } from 'react';
import { Dayjs } from 'dayjs';
import placeholder from '../../assets/Placeholder.svg';
import { MEDIA_TYPES, OBJECT_ORIGIN } from '../mmu_types.ts';

const caddyUrl = import.meta.env.VITE_CADDY_URL;

interface Item {
  id: number;
  created_at: Dayjs;
  mediaTypes?: MEDIA_TYPES;
  origin?: OBJECT_ORIGIN;
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
  refreshKey?: number;
}

type UseFetchThumbnailsUrlResult = [isLoading: boolean, url: string];

export default function useFetchThumbnailsUrl({
  item,
  refreshKey,
}: UseFetchThumbnailsUrlParams): UseFetchThumbnailsUrlResult {
  const [state, setState] = useState<{ url: string; isLoading: boolean }>({
    url: placeholder,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const isDataSvg = (url?: string) =>
      typeof url === 'string' && url.trim().startsWith('data:image/svg+xml');

    const setSafe = (url: string, isLoading: boolean) => {
      if (!cancelled) setState({ url, isLoading });
    };

    const addCacheBuster = (url: string): string => {
      if (!refreshKey) return url;
      if (url.startsWith('data:')) return url;
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}v=${refreshKey}`;
    };

    const buildManifestUrl = (): string | null => {
      let base: string | null = null;

      if (item.origin === OBJECT_ORIGIN.UPLOAD && item.hash && item.title) {
        base = `${caddyUrl}/${item.hash}/${item.title}`;
      } else if (item.origin === OBJECT_ORIGIN.LINK && item.path) {
        base = item.path;
      } else if (
        item.origin === OBJECT_ORIGIN.CREATE &&
        item.hash &&
        item.path
      ) {
        base = `${caddyUrl}/${item.hash}/${item.path}`;
      }

      return base ? addCacheBuster(base) : null;
    };

    const tryToFetchThumbnail = async () => {
      setSafe(placeholder, true);

      let nextUrl: string = placeholder;

      try {
        if (item.thumbnailUrl) {
          nextUrl = item.thumbnailUrl;
        } else {
          // 2. Manifest-based resolve
          const manifestUrl = buildManifestUrl();
          if (!manifestUrl) {
            nextUrl = placeholder;
          } else {
            const response = await fetch(manifestUrl);
            if (!response.ok) {
              nextUrl = placeholder;
            } else {
              const data = await response.json();

              const v2Thumb = data?.thumbnail?.['@id'] as string | undefined;
              const v3Thumb = data?.items?.[0]?.thumbnail?.[0]?.id as
                | string
                | undefined;

              nextUrl = v2Thumb || v3Thumb || placeholder;
            }
          }
        }
      } catch (err) {
        nextUrl = placeholder;
      } finally {
        if (!nextUrl || isDataSvg(nextUrl)) {
          nextUrl = placeholder;
        } else {
          nextUrl = addCacheBuster(nextUrl);
        }

        setSafe(nextUrl, false);
      }
    };

    tryToFetchThumbnail();

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
    refreshKey,
  ]);

  return [state.isLoading, state.url];
}
