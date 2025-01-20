import storage from '../../../utils/storage.ts';
import { AnnotationPageDto } from '../type/type.ts';

export const upsertAnnotationPage = async (annotationPageDto: AnnotationPageDto) => {
  try {
    const token = storage.getToken();
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/annotation-page`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(annotationPageDto)
    });
    const annotationPageSaved = await response.json();
    // TODO Why is it a simple object and not array here ?
    if (annotationPageSaved[0].content) {
      return annotationPageSaved[0].content;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
  }
};
