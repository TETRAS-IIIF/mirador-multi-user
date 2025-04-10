const storagePrefix = 'Mirador-multi-user-';
const storage = {
  getToken: () => {
    return JSON.parse(localStorage.getItem(`${storagePrefix}token`) as string);
  },
  setToken: (token: string) => {
    if (token == undefined) {
      console.error('token is undefined');
      return;
    }
    window.localStorage.setItem(`${storagePrefix}token`, JSON.stringify(token));
  },
  clearToken: () => {
    window.localStorage.removeItem(`${storagePrefix}token`);
  },
  GetImpersonateUserData: (): string | null => {
    return localStorage.getItem(`${storagePrefix}impersonate-user`);
  },
  SetImpersonateUserId: (mail: string) => {
    window.localStorage.setItem(`${storagePrefix}impersonate-user`, `${mail}`);
  },
  setUserEmail: (mail: string) => {
    window.localStorage.setItem(`${storagePrefix}user_mail`, mail);
  },
  getUserEmail: () => {
    return window.localStorage.getItem(`${storagePrefix}user_mail`);
  },
  clearUserEmail: () => {
    window.localStorage.removeItem(`${storagePrefix}user_mail`);
  },
};

export default storage;
