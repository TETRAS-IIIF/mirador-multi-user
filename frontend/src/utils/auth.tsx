import storage from './storage.ts';
import { getUser } from '../features/auth/api/getUser.ts';
import {
  login,
  LoginCredentialsDTO,
  register,
  RegisterCredentialsDTO,
  User,
  UserResponse,
} from '../features/auth/export.ts';
import { configureAuth } from 'react-query-auth';
import { CircularProgress, Grid } from '@mui/material';

export async function handleTokenResponse(data: UserResponse) {
  const { access_token, user } = data;
  console.log('handleToken response', access_token);
  storage.setToken(access_token);
  return user;
}

async function loadUser(): Promise<User | null> {
  if (storage.getToken()) {
    return await getUser();
  }
  return null;
}

async function loginFn(data: LoginCredentialsDTO) {
  console.log('loginFn data', data);
  const response = await login(data);
  return await handleTokenResponse(response);
}

async function registerFn(data: RegisterCredentialsDTO) {
  console.log('registerFn data', data);
  const response = await register(data);
  return await handleTokenResponse(response);
}

async function logoutFn() {
  storage.clearToken();
  console.log('logoutFn');
}

const authConfig = {
  userFn: loadUser,
  loginFn,
  registerFn,
  logoutFn,
  LoaderComponent() {
    return (
      <Grid>
        <CircularProgress />
      </Grid>
    );
  },
};

export const { useUser, useLogin, useRegister, useLogout } = configureAuth<
  User | null,
  unknown,
  LoginCredentialsDTO,
  RegisterCredentialsDTO
>(authConfig);
