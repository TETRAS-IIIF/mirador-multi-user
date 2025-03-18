import storage from "./storage.ts";

export const fetchBackendAPIConnected = async (
  requestPath: string,
  options: RequestInit = {},
  successCallback?: (response: Response) => any,
  errorCallback?: (response: Response) => any,
) => {
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${storage.getToken()}`,
  };
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/${requestPath}`,
    options,
  );

  if (response.ok) {
    if (successCallback) {
      successCallback(response);
    }
    return await response.json();
  } else {
    if (response.status === 401) {
      // Redirect to root page to fallback on login page if user is disconnected
      window.location.assign(`${window.location.origin}/disconnect`);
    }
    if (errorCallback) {
      errorCallback(response);
    }
  }
};
