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
import { logoutUser } from '../features/auth/api/logoutUser.ts';

export async function handleTokenResponse(data: UserResponse) {
  const { access_token, user } = data;
  storage.setToken(access_token);
  return user;
}

async function loadUser(): Promise<User | null> {
  if (!storage.getToken()) return null;
  return await getUser();
}

async function loginFn(data: LoginCredentialsDTO) {
  const response = await login(data);
  return await handleTokenResponse(response);
}

async function registerFn(data: RegisterCredentialsDTO) {
  const response = await register(data);
  return await handleTokenResponse(response);
}

async function logoutFn() {
  await logoutUser();
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
