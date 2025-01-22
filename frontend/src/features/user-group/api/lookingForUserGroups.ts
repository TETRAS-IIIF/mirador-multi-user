import storage from '../../../utils/storage.ts';

export const lookingForUserGroups = async (partialUserGroupName: string) => {
  try {
    const token = storage.getToken();
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-user-group/looking-for-userGroups/${partialUserGroupName}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
    const toreturn = await response.json();
    return toreturn;
  } catch (error) {
    console.error(error);
  }
}
