import { AnnotationPage } from '../../../BaseEntities/annotation-page/entities/annotation-page.entity';

interface ManifestEntry {
  isFetching: boolean;
  id: string;
  error: null | string;
  json: {
    '@context': string;
    id: string;
    type: string;
    label?: Record<string, any>;
    items?: any[];
    thumbnail?: Record<string, any>;
    rights?: string;
    provider?: any[];
    requiredStatement?: Record<string, any>;
    logo?: Record<string, any>;
    metadata?: any[];
  };
}

type ManifestsMap = Record<string, ManifestEntry>;

function getAnnotationIdFromItem(item: any): string | null {
  const target = item?.target;
  if (!target) return null;

  if (typeof target === 'object' && target.source) return String(target.source);
  if (typeof target === 'string') return target.split('#xywh')[0];

  return null;
}

function addAnnotationToMatchingCanvas(
  manifests: ManifestsMap,
  annotationId: string,
  page: AnnotationPage,
): void {
  for (const manifest of Object.values(manifests)) {
    const items = manifest?.json?.items;
    if (!Array.isArray(items)) continue;

    const match = items.find((it: any) => it?.id === annotationId);
    if (!match) continue;

    if (!Array.isArray(match.annotations)) match.annotations = [];
    match.annotations.push({ id: page.annotationPageId, ...page.content });
  }
}

export const constructSnapshotWorkspace = (
  annotationPages: AnnotationPage[],
  miradorWorkspace: Record<string, ManifestEntry> & {
    manifests?: ManifestsMap;
  },
): Record<string, ManifestEntry> => {
  const manifests: ManifestsMap =
    (miradorWorkspace as any).manifests ?? (miradorWorkspace as ManifestsMap);

  for (const page of annotationPages) {
    const pageItems = page?.content?.items;
    if (!Array.isArray(pageItems)) continue;

    for (const item of pageItems) {
      const annotationId = getAnnotationIdFromItem(item);
      if (!annotationId) continue;

      addAnnotationToMatchingCanvas(manifests, annotationId, page);
    }
  }

  return miradorWorkspace;
};
