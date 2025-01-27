import { upsertAnnotationPage } from "../api/upsertAnnotationPage.ts";
import { gettingAnnotationPage } from "../api/gettingAnnotationPage.ts";
import { deleteAnnotationPage } from "../api/deleteAnnotationPage.ts";

export default class MMUAdapter {
  /** */
  constructor(projectId, annotationPageId) {
    this.projectId = projectId;
    this.annotationPageId = annotationPageId;
  }

  /** */
  async create(annotation) {
    const emptyAnnoPage = {
      id: this.annotationPageId,
      items: [],
      type: "AnnotationPage",
    };
    let annotationPage = await this.all();
    if (annotationPage.length < 1) {
      annotationPage = emptyAnnoPage;
    }
    annotationPage.items.push(annotation);
    return await upsertAnnotationPage({
      projectId: this.projectId,
      annotationPageId: this.annotationPageId,
      content: annotationPage,
    });
  }

  /** */
  async update(annotation) {
    const annotationPage = await this.all();
    if (annotationPage) {
      const currentIndex = annotationPage.items.findIndex(
        (item) => item.id === annotation.id,
      );
      annotationPage.items.splice(currentIndex, 1, annotation);
      return await upsertAnnotationPage({
        projectId: this.projectId,
        annotationPageId: this.annotationPageId,
        content: annotationPage,
      });
    }
    return null;
  }

  /** */
  async delete(annoId) {
    if (!annoId) {
      return await deleteAnnotationPage(this.annotationPageId, this.projectId);
    }
    const annotationPage = await this.all();
    if (annotationPage) {
      annotationPage.items = annotationPage.items.filter(
        (item) => item.id !== annoId,
      );
    }
    return await upsertAnnotationPage({
      projectId: this.projectId,
      annotationPageId: this.annotationPageId,
      content: annotationPage,
    });
  }

  /** */
  async get(annoId) {
    const annotationPage = await this.all();
    if (annotationPage) {
      return annotationPage.items.find((item) => item.id === annoId);
    }
    return null;
  }

  /** */
  async all() {
    // At this point, but I think we must have only one annotation page. For now it's not the case
    let annotationPage = await gettingAnnotationPage(
      this.annotationPageId,
      this.projectId,
    );
    if (annotationPage.length > 0) {
      return annotationPage[0].content;
    } else {
      return [];
    }
  }
}
