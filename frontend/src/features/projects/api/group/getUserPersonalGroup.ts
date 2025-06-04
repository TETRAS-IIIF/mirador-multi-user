import { fetchBackendAPIConnected } from '../../../../utils/fetchBackendAPI.ts';
import { UserGroup } from '../../../user-group/types/types.ts';

export const getUserPersonalGroup = async (
  userId: number,
): Promise<UserGroup> => {
  return await fetchBackendAPIConnected(
    `link-user-group/user-personal-group/${userId}`,
    {
      method: 'GET',
    },
  );
};
