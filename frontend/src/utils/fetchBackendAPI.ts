import storage from './storage.ts';

/**
 * Fetch wrapper designed to be used when user is connected.
 * It will automatically redirect to the login page if the user is disconnected.
 * @param requestPath
 * @param options
 */
export const fetchBackendAPIConnected = async (
  requestPath: string,
  options: RequestInit = {},
) => {
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${storage.getToken()}`,
  };
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/${requestPath}`,
    options,
  );
  if (response.status === 401) {
    // Redirect to root page to fallback on login page if user is disconnected
    window.location.assign(window.location.origin);
  }

  return await response.json();
};
