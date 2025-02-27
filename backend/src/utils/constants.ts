/***********************************************************
 * Utils constants of MMU Backend
 **********************************************************/

// Upload folder to store file.
// This folder is mounted by volume on the host and exposed the caddy container
// See docker-compose.yml file for more details
export const UPLOAD_FOLDER = './upload';

// Default snapshot file name
export const DEFAULT_PROJECT_SNAPSHOT_FILE_NAME = 'workspace.json';

export const THUMBNAIL_FILE_SUFFIX = '_thumbnail.webp';

export const MARIA_DB_PORT = 3306;
