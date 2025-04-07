export type ImpersonateUserData = {
  id: number;
  name: string;
  isEmailConfirmed: string;
};


export type Setting = {
  id: number;
  key: string;
  value: string;
};

export type Settings = {
  mutableSettings: Setting[];
  unMutableSettings: [string, string][];
};
