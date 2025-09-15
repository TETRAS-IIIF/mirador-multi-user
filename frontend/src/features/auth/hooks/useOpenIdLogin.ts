import { openIdLogin } from '../api/openIdLogin.ts';
import { useMutation } from '@tanstack/react-query';

export const useOpenIdLogin = () =>
  useMutation({
    mutationFn: openIdLogin,
  });
