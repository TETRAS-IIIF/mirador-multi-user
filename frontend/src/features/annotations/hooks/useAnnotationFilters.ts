import { useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Fuse from 'fuse.js';
import { getCanvasIdFromTarget } from '../annotationUtils.ts';

export interface AnnotationBody {
  purpose?: string;
  value?: string;
  id?: string;
  type?: string;
}

export interface MaeDataTag {
  label: string;
  value: string;
  __isNew__?: boolean;
}

export interface MaeDataTarget {
  drawingState: string;
  fullCanvaXYWH: string;
  scale: number;
  svg: string;
}

export interface MaeData {
  tags: MaeDataTag[];
  target: MaeDataTarget;
  templateType: string;
  textBody: AnnotationBody;
}

export interface Annotation {
  id?: string;
  type?: string;
  projectId: string | number;
  projectName?: string;
  creator?: string;
  lastEditor?: string;
  motivation?: string;
  creationDate?: string;
  lastSavedDate?: string;
  target?: any;
  body?: AnnotationBody | AnnotationBody[];
  maeData?: MaeData;
}
export interface AnnotationBody {
  purpose?: string;
  value?: string;
  id?: string;
  type?: string;
}

export interface UseAnnotationFiltersResult {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedProjects: string[];
  setSelectedProjects: (v: string[]) => void;
  selectedCreators: string[];
  setSelectedCreators: (v: string[]) => void;
  selectedTags: string[];
  setSelectedTags: (v: string[]) => void;
  selectedCanvasIds: string[];
  setSelectedCanvasIds: (v: string[]) => void;
  dateFrom: Dayjs | null;
  setDateFrom: (v: Dayjs | null) => void;
  dateTo: Dayjs | null;
  setDateTo: (v: Dayjs | null) => void;
  creatorOptions: string[];
  projectOptions: string[];
  tagOptions: string[];
  canvasIdOptions: string[];
  activeFilterCount: number;
  filteredAnnotations: Annotation[];
  resetFilters: () => void;
}

export const useAnnotationFilters = (
  annotations: Annotation[],
): UseAnnotationFiltersResult => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCanvasIds, setSelectedCanvasIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);

  const creatorOptions = useMemo<string[]>(
    () => [
      ...new Set(
        annotations
          .map((a) => a.creator)
          .filter((c): c is string => Boolean(c)),
      ),
    ],
    [annotations],
  );

  const projectOptions = useMemo<string[]>(
    () => [
      ...new Set(
        annotations
          .map((a) => a.projectName || String(a.projectId))
          .filter((p): p is string => Boolean(p)),
      ),
    ],
    [annotations],
  );

  const tagOptions = useMemo<string[]>(() => {
    const tags = new Set<string>();
    annotations.forEach((a) => {
      const body = Array.isArray(a.body) ? a.body : a.body ? [a.body] : [];
      body
        .filter((b) => b?.purpose === 'tagging')
        .forEach((b) => {
          if (b.value) tags.add(b.value);
        });
    });
    return [...tags];
  }, [annotations]);

  const canvasIdOptions = useMemo<string[]>(
    () => [
      ...new Set(
        annotations
          .map((a) => {
            const target = Array.isArray(a.target) ? a.target[0] : a.target;
            return getCanvasIdFromTarget(target);
          })
          .filter((id): id is string => Boolean(id)),
      ),
    ],
    [annotations],
  );

  const activeFilterCount = [
    selectedProjects.length > 0,
    selectedCreators.length > 0,
    selectedTags.length > 0,
    selectedCanvasIds.length > 0,
    dateFrom !== null,
    dateTo !== null,
  ].filter(Boolean).length;

  const filteredAnnotations = useMemo<Annotation[]>(() => {
    let result = annotations;

    if (selectedProjects.length > 0) {
      result = result.filter((a) =>
        selectedProjects.includes(a.projectName || String(a.projectId)),
      );
    }

    if (selectedCreators.length > 0) {
      result = result.filter(
        (a) => a.creator && selectedCreators.includes(a.creator),
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((a) => {
        const body = Array.isArray(a.body) ? a.body : a.body ? [a.body] : [];
        const annotationTags = body
          .filter((b) => b?.purpose === 'tagging')
          .map((b) => b.value)
          .filter((v): v is string => Boolean(v));
        return selectedTags.some((tag) => annotationTags.includes(tag));
      });
    }

    if (selectedCanvasIds.length > 0) {
      result = result.filter((a) => {
        const target = Array.isArray(a.target) ? a.target[0] : a.target;
        const canvasId = getCanvasIdFromTarget(target);
        return canvasId ? selectedCanvasIds.includes(canvasId) : false;
      });
    }

    if (dateFrom) {
      result = result.filter((a) => {
        if (!a.creationDate) return false;
        return dayjs(a.creationDate).isAfter(dateFrom.subtract(1, 'day'));
      });
    }

    if (dateTo) {
      result = result.filter((a) => {
        if (!a.creationDate) return false;
        return dayjs(a.creationDate).isBefore(dateTo.add(1, 'day'));
      });
    }

    if (!searchQuery) return result;

    const fuse = new Fuse(result, {
      keys: [
        'projectName',
        'creator',
        'motivation',
        'body.value',
        'body.purpose',
      ],
      threshold: 0.3,
      ignoreLocation: true,
      includeScore: true,
    });

    return fuse.search(searchQuery).map((r) => r.item);
  }, [
    annotations,
    searchQuery,
    selectedProjects,
    selectedCreators,
    selectedTags,
    selectedCanvasIds,
    dateFrom,
    dateTo,
  ]);

  const resetFilters = () => {
    setSelectedProjects([]);
    setSelectedCreators([]);
    setSelectedTags([]);
    setSelectedCanvasIds([]);
    setDateFrom(null);
    setDateTo(null);
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedProjects,
    setSelectedProjects,
    selectedCreators,
    setSelectedCreators,
    selectedTags,
    setSelectedTags,
    selectedCanvasIds,
    setSelectedCanvasIds,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    creatorOptions,
    projectOptions,
    tagOptions,
    canvasIdOptions,
    activeFilterCount,
    filteredAnnotations,
    resetFilters,
  };
};
