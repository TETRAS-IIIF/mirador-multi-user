const storagePrefix = 'Mirador-multi-user-';

const getLocalStorage = (): Storage | undefined =>
  typeof window !== 'undefined' ? window.localStorage : undefined;

const storage = {
  getToken: () => {
    const token = getLocalStorage()?.getItem(`${storagePrefix}token`);
    return token ? JSON.parse(token) : null;
  },
  setToken: (token: string) => {
    if (token == undefined) {
      console.error('token is undefined');
      return;
    }
    getLocalStorage()?.setItem(`${storagePrefix}token`, JSON.stringify(token));
  },
  clearToken: () => {
    getLocalStorage()?.removeItem(`${storagePrefix}token`);
  },
  setIsImpersonating: (value: boolean) => {
    getLocalStorage()?.setItem(
      `${storagePrefix}is_impersonating`,
      JSON.stringify(value),
    );
  },
  setUserEmail: (mail: string) => {
    getLocalStorage()?.setItem(`${storagePrefix}user_mail`, mail);
  },
  getUserEmail: () => {
    return getLocalStorage()?.getItem(`${storagePrefix}user_mail`) ?? null;
  },
  clearUserEmail: () => {
    getLocalStorage()?.removeItem(`${storagePrefix}user_mail`);
  },
};

export default storage;
