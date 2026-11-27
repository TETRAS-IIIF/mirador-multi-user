import { gettingAnnotationPage } from '../api/gettingAnnotationPage.ts';
import { deleteAnnotationPage } from '../api/deleteAnnotationPage.ts';
import {
  AnnotationApiError,
  acceptAnnotation,
  acceptAnnotations,
  createAnnotation,
  deleteAnnotation,
  deleteAnnotations,
  updateAnnotation,
} from '../api/annotationApi.ts';
import toast from 'react-hot-toast';
import { t } from 'i18next';

/**
 * Versions of the annotations as last loaded or saved (`mmu:version`), per
 * project: sent back on save, so the server refuses to overwrite an
 * annotation someone else saved meanwhile. Module-wide because Mirador
 * creates a new adapter for each call.
 */
const versions = new Map();
const versionKey = (projectId, annotationId) => `${projectId}|${annotationId}`;

/** Records the versions of a page's annotations. */
function rememberVersions(projectId, page) {
  (page?.items ?? []).forEach((item) => {
    if (item?.id && item['mmu:version'] != null) {
      versions.set(versionKey(projectId, item.id), String(item['mmu:version']));
    }
  });
}

/**
 * Mirador annotation adapter for one canvas page of an MMU project.
 *
 * Each call changes one annotation on the server (`/annotation` routes), so
 * two people editing the same canvas no longer overwrite each other. Every
 * write resolves to the canvas AnnotationPage, as Mirador expects.
 *
 * Drafts (annotations suggested by the assistant) are part of the page only
 * when `options.showDrafts()` returns true. They carry `mmu:status: 'draft'`.
 */
export default class MMUAdapter {
  /** */
  constructor(projectId, annotationPageId, user, options = {}) {
    this.projectId = projectId;
    this.annotationPageId = annotationPageId;
    this.user = user;
    this.showDrafts = options.showDrafts ?? (() => false);
    this.onChange = options.onChange ?? (() => {});
  }

  /**
   * Get the storage adapter user
   * @returns {*}
   */
  getStorageAdapterUser() {
    return this.user;
  }

  /** @private */
  emptyPage() {
    return { id: this.annotationPageId, items: [], type: 'AnnotationPage' };
  }

  /** @private */
  async changed() {
    this.onChange();
    return this.all();
  }

  /** */
  async create(annotation) {
    await createAnnotation({
      projectId: this.projectId,
      annotationPageId: this.annotationPageId,
      content: annotation,
    });
    return this.changed();
  }

  /**
   * Saving from the editor publishes a draft, unless the annotation still
   * says it is one.
   */
  async update(annotation) {
    const status =
      annotation['mmu:status'] === 'draft' ? undefined : 'published';
    const key = versionKey(this.projectId, annotation.id);
    const expectedVersion = annotation['mmu:version'] ?? versions.get(key);
    try {
      const row = await updateAnnotation(this.projectId, annotation.id, {
        content: annotation,
        status,
        ...(expectedVersion != null
          ? { expectedVersion: String(expectedVersion) }
          : {}),
      });
      if (row?.content?.['mmu:version'] != null) {
        versions.set(key, String(row.content['mmu:version']));
      }
    } catch (error) {
      // Someone else saved this annotation since it was opened: keep the
      // editor open (the text is not lost) and say so.
      if (error instanceof AnnotationApiError && error.status === 409) {
        toast.error(t('annotationConflict'), { duration: 10000 });
      }
      throw error;
    }
    return this.changed();
  }

  /** */
  async delete(annoId) {
    if (!annoId) {
      await deleteAnnotationPage(this.annotationPageId, this.projectId);
      return this.changed();
    }
    try {
      await deleteAnnotation(this.projectId, annoId);
    } catch (error) {
      // The editor calls delete on the adapter of every visible canvas:
      // 404 means the annotation was on another canvas (or already gone).
      if (!(error instanceof AnnotationApiError) || error.status !== 404) {
        throw error;
      }
    }
    return this.changed();
  }

  /** Publishes one draft. */
  async accept(annoId) {
    await acceptAnnotation(this.projectId, annoId);
    return this.changed();
  }

  /** Publishes every draft of this canvas. */
  async acceptAll() {
    await acceptAnnotations({
      annotationPageId: this.annotationPageId,
      projectId: this.projectId,
    });
    return this.changed();
  }

  /** Deletes every draft of this canvas. */
  async rejectAll() {
    await deleteAnnotations({
      annotationPageId: this.annotationPageId,
      projectId: this.projectId,
      status: 'draft',
    });
    return this.changed();
  }

  /** */
  async get(annoId) {
    const annotationPage = await this.all();
    return annotationPage.items.find((item) => item.id === annoId) ?? null;
  }

  /** */
  async all() {
    const pages = await gettingAnnotationPage(
      this.annotationPageId,
      this.projectId,
      this.showDrafts(),
    );
    if (Array.isArray(pages) && pages.length > 0 && pages[0].content) {
      rememberVersions(this.projectId, pages[0].content);
      return pages[0].content;
    }
    return this.emptyPage();
  }
}
