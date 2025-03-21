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

export const constructSnapshotWorkspace = (
  annotationPages: AnnotationPage[],
  miradorWorkspace: Record<string, ManifestEntry>,
): Record<string, ManifestEntry> => {
  annotationPages.forEach((page) => {
    if (page.content?.items && Array.isArray(page.content.items)) {
      page.content.items.forEach((item) => {
        if (item.target) {
          const annotationId = item.target.source
            ? item.target.source
            : item.target.split('#xywh')[0];

          Object.entries(miradorWorkspace.manifests).forEach(
            ([_, manifest]) => {
              if (manifest?.json?.items && Array.isArray(manifest.json.items)) {
                const matchingItem = manifest.json.items.find(
                  (manifestItem) => manifestItem.id === annotationId,
                );

                if (matchingItem) {
                  if (!matchingItem.annotations) {
                    matchingItem.annotations = [];
                  }

                  matchingItem.annotations.push({
                    id: page.annotationPageId,
                    ...page.content,
                  });
                }
              }
            },
          );
        }
      });
    }
  });

  return miradorWorkspace;
};
