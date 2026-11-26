import { constructSnapshotWorkspace } from './snapshot.utils';

const CANVAS = 'https://example.org/canvas/1';
const OTHER = 'https://example.org/canvas/2';

const workspace = () => ({
  manifests: {
    'https://example.org/manifest.json': {
      isFetching: false,
      id: 'https://example.org/manifest.json',
      error: null,
      json: {
        '@context': 'http://iiif.io/api/presentation/3/context.json',
        id: 'https://example.org/manifest.json',
        type: 'Manifest',
        items: [
          { id: CANVAS, type: 'Canvas' },
          { id: OTHER, type: 'Canvas' },
        ],
      },
    },
  },
});

const page = (items: any[]) => ({
  annotationPageId: `${CANVAS}/annotationPage`,
  content: {
    id: 'https://mmu.example.org/internal/search?page=1',
    type: 'AnnotationPage',
    items,
  },
});

const annotation = (id: string, target: any) => ({
  id,
  type: 'Annotation',
  target,
});

describe('constructSnapshotWorkspace', () => {
  it('adds a page once per canvas, however many annotations it has there', () => {
    const result = constructSnapshotWorkspace(
      [
        page([
          annotation('a1', { source: CANVAS }),
          annotation('a2', `${CANVAS}#xywh=0,0,10,10`),
          annotation('a3', { source: CANVAS }),
        ]),
      ],
      workspace() as any,
    ) as any;
    const [canvas, other] =
      result.manifests['https://example.org/manifest.json'].json.items;
    expect(canvas.annotations).toHaveLength(1);
    expect(canvas.annotations[0].items).toHaveLength(3);
    expect(other.annotations).toBeUndefined();
  });

  it("keeps MMU's page id, not the id stored in the page content", () => {
    const result = constructSnapshotWorkspace(
      [page([annotation('a1', { source: CANVAS })])],
      workspace() as any,
    ) as any;
    const injected =
      result.manifests['https://example.org/manifest.json'].json.items[0]
        .annotations[0];
    expect(injected.id).toBe(`${CANVAS}/annotationPage`);
  });

  it("leaves the project's workspace untouched", () => {
    const live = workspace();
    const before = JSON.stringify(live);
    const result = constructSnapshotWorkspace(
      [page([annotation('a1', { source: CANVAS })])],
      live as any,
    );
    expect(JSON.stringify(live)).toBe(before);
    expect(result).not.toBe(live);
  });

  it('returns nothing without a workspace', () => {
    expect(constructSnapshotWorkspace([], null)).toBeUndefined();
  });
});
