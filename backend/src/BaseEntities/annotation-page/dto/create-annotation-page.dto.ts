export interface AnnotationBodyItem {
  type?: string;
  value?: string;
  purpose?: string;
  [key: string]: unknown;
}

export interface MaeDataTarget {
  [key: string]: unknown;
}

export interface MaeData {
  tags: string[];
  target: MaeDataTarget;
  templateType: string;
  textBody: Record<string, unknown>;
}

export interface AnnotationPageContent {
  body: AnnotationBodyItem[];
  maeData: MaeData;
  motivation: string;
  target: string;
  id: string;
  creationDate: string;
  creator: string;
  lastSavedDate: string;
  lastEditor: string;
  projectId: number;
  projectName: string;
}

export class CreateAnnotationPageDto {
  annotationPageId: string;
  content: AnnotationPageContent;
  projectId: number;
}
