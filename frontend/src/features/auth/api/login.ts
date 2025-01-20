import { UserResponse } from '../types/types.ts';
import toast from 'react-hot-toast';

export type LoginCredentialsDTO = {
  mail: string;
  password: string;
  isImpersonate?: string;
};

export const login = async (data: LoginCredentialsDTO): Promise<UserResponse> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cache-control': 'no-store',
        'pragma': 'no-cache'
      },
      body: JSON.stringify(data),
      cache: 'no-store'
    });
    if (!response.ok) {
      toast.error('Failed to log user');
      throw new Error('Failed to log user');
    }

    const { access_token } = await response.json();
    const profileResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    const profile = await profileResponse.json();
    return {
      user: profile,
      access_token: access_token
    };
  } catch (error) {
    throw error;
  }
};
