import dayjs from 'dayjs';
import JSZip from 'jszip';

export const getAnnotationPageId = (anno: any): string | null => {
  const target = Array.isArray(anno.target) ? anno.target[0] : anno.target;

  let canvasUri: string | null = null;

  if (typeof target === 'string') {
    canvasUri = target.split('#')[0];
  } else if (typeof target === 'object' && target !== null) {
    const source = target.source ?? target.id ?? target['@id'];
    canvasUri = source ? source.split('#')[0] : null;
  }

  if (!canvasUri) return null;

  return `${canvasUri}/annotationPage`;
};

export const getAnnotationId = (anno: any, index: number): string =>
  anno.id ? String(anno.id) : String(index);

export const getCanvasIdFromTarget = (target: any): string | undefined => {
  return typeof target === 'string'
    ? target.split('#')[0]
    : target?.source?.split('#')[0];
};

export const highlightHTML = (
  htmlContent: string,
  highlight: string,
): string => {
  if (!highlight.trim()) return htmlContent;
  const regex = new RegExp(`(?![^<]*>)(${highlight})`, 'gi');
  return htmlContent.replace(
    regex,
    '<mark style="background-color: #fff59d; padding: 0;">$1</mark>',
  );
};

export const downloadAnnotationsAsZip = async (
  annotations: any[],
): Promise<void> => {
  const zip = new JSZip();

  annotations.forEach((anno, i) => {
    const filename = `annotation_${i + 1}.json`;
    zip.file(filename, JSON.stringify(anno, null, 2));
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `annotations_${dayjs().format('YYYY-MM-DD')}.zip`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 150);
};
