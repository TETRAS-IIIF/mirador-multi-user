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
  setAdminToken: (token: string) => {
    if (token == null) {
      return;
    }
    window.localStorage.setItem(`${storagePrefix}admintoken`, token);
  },
  getAdminToken: () => {
    return window.localStorage.getItem(`${storagePrefix}admintoken`);
  },
  clearAdminToken: () => {
    window.localStorage.removeItem(`${storagePrefix}admintoken`);
  }
};

export default storage;
