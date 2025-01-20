import storage from '../../../utils/storage.ts';
import { UploadAndLinkManifestDto } from '../types/types.ts';
import toast from 'react-hot-toast';

export const uploadManifest = async (createManifestDto: UploadAndLinkManifestDto) => {
  const token = storage.getToken();
  const formData = new FormData();
  formData.append('file', createManifestDto.file!);
  formData.append('idCreator', createManifestDto.idCreator.toString());

  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-manifest-group/manifest/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    console.log('response', response);
    if (response.status === 400) {
      toast.error('The manifest must be in PDF format.');
      throw new Error('invalid format');
    }
    throw new Error(`Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};
