import storage from '../../../utils/storage.ts';
import toast from 'react-hot-toast';
import { t } from 'i18next';

export const validateUser = async (userId: number) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-user-group/validate-user/${userId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    if (response.status == 201) {
      toast.success(t('userValidated'));
      storage.clearToken();
    } else {
      toast.error(t('userValidationFail'));
    }
  } catch (error) {
    toast.error(t('userValidationFail'));
  }
};
