import { Manifest } from '../../manifest/types/types.ts';
import storage from '../../../utils/storage.ts';

export const getUserGroupManifests = async (userGroupId: number): Promise<Manifest[]> => {
  const token = storage.getToken();

  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-manifest-group/group/${userGroupId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();

};
