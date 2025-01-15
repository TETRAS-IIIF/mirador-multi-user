export const fetchManifest = async (hash:string,path:string):Promise<Record<string, string> | undefined> => {
  try {
    const caddyUrl = import.meta.env.VITE_CADDY_URL
    const response = await fetch(`${caddyUrl}/${hash}/${path}`,{
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.statusText}`);
    }
    const toreturn = await response.json()
    return toreturn;
  } catch (err) {
    console.error(err);
  }
}
