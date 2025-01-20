import storage from '../../../utils/storage.ts';

export const removeAccessToMedia = async (mediaId: number, groupId: number) => {
  const token = storage.getToken();
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-media-group/media/${mediaId}/${groupId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
