import { Manifest } from '../types/types.ts';
import storage from '../../../utils/storage.ts';

export const lookingForManifests = async (partialString:string, userGroupId:number) :Promise<Manifest[]>=> {
  const token = storage.getToken();
  try{
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/manifest/search/${userGroupId}/${partialString}`,{
      method: 'GET',
      headers:{
        authorization: `Bearer ${token}`,
      }})
    if(response.status === 404){
      return []
    }
    return await response.json();
  }catch(error){
    throw error;
  }
}
