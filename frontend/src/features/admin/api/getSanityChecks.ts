import { fetchBackendAPIConnected } from '../../../utils/fetchBackendAPI.ts';

export interface SanityCheckResult {
  key: string;
  passed: boolean;
  details?: string;
}

export const getSanityChecks = async (): Promise<SanityCheckResult[]> => {
  return await fetchBackendAPIConnected('sanity-check', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
