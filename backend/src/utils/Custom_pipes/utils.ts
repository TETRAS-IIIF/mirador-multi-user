import { InternalServerErrorException } from '@nestjs/common';

export function isYouTubeVideo(url: string): boolean {
  const youtubeRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|.+\?v=)?([^&\n?#]+)/;
  return youtubeRegex.test(url);
}

export async function isVideo(url: string): Promise<boolean> {
  const response = await fetch(`${url}`, { method: 'HEAD' });
  if (!response.ok) {
    throw new Error(
      `HTTP error! status: ${response.status}, message: ${response.statusText}`,
    );
  }
  return response.headers.get('Content-Type')?.startsWith('video') || false;
}

export async function isPeerTubeVideo(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch the URL');

    const htmlContent = await response.text();
    return htmlContent.includes(
      '<meta property="og:platform" content="PeerTube">',
    );
  } catch (error) {
    console.error(`Error checking PeerTube meta tag: ${error.message}`);
    return false;
  }
}

export async function getYoutubeThumbnail(id: string): Promise<Buffer> {
  const response = await fetch(`https://img.youtube.com/vi/${id}/default.jpg`);
  if (!response.ok) throw new Error('Failed to fetch YouTube thumbnail');
  return Buffer.from(await response.arrayBuffer());
}

export async function getPeerTubeThumbnail(
  url: string,
  videoId: string,
): Promise<Buffer> {
  const baseDomain = new URL(url).origin;
  const apiURL = `${baseDomain}/api/v1/videos/${videoId}`;
  const response = await fetch(apiURL);

  if (!response.ok) {
    throw new Error('Failed to fetch PeerTube video details');
  }

  const data = await response.json();
  let thumbnailUrl = data.thumbnailPath;
  if (!thumbnailUrl.startsWith('http')) {
    thumbnailUrl = `${baseDomain}${thumbnailUrl}`;
  }

  const thumbnailResponse = await fetch(thumbnailUrl);
  if (!thumbnailResponse.ok) {
    throw new Error('Failed to fetch PeerTube thumbnail');
  }

  const contentType = thumbnailResponse.headers.get('Content-Type');
  if (!contentType?.startsWith('image/')) {
    throw new Error('Fetched data is not a valid image');
  }

  const arrayBuffer = await thumbnailResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function getPeerTubeVideoDetails(
  url: string,
  videoId: string,
): Promise<any> {
  const baseDomain = new URL(url).origin;
  const apiURL = `${baseDomain}/api/v1/videos/${videoId}`;
  const response = await fetch(apiURL);

  if (!response.ok) {
    throw new Error('Failed to fetch PeerTube video details');
  }

  const data = await response.json();
  return data;
}

export function getYouTubeVideoID(url: string): string | null {
  const youtubeRegex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|.+\?v=)|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(youtubeRegex);
  return match ? match[1] : null;
}

type YoutubeMetadata = {
  title: string;
  durationSeconds: number;
  thumbnails: Record<string, { url: string; width: number; height: number }>;
};

// ISO 8601 PT#H#M#S -> seconds
export const iso8601ToSeconds = (iso: string): number => {
  const re = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const [, d, h, m, s] = iso.match(re) || [];
  const dd = d ? parseInt(d, 10) : 0;
  const hh = h ? parseInt(h, 10) : 0;
  const mm = m ? parseInt(m, 10) : 0;
  const ss = s ? parseInt(s, 10) : 0;
  return dd * 86400 + hh * 3600 + mm * 60 + ss;
};

export const fetchYouTubeMeta = async (
  videoId: string,
): Promise<YoutubeMetadata | null> => {
  const apiKey = process.env.YOUTUBE_API_KEY as string;
  if (!apiKey) {
    throw new InternalServerErrorException('Youtube API key is empty');
  }
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(
      videoId,
    )}&part=snippet,contentDetails&key=${apiKey}`,
  );
  if (!response.ok) return null;
  const youtubevideoData = await response.json();
  if (!youtubevideoData.items?.length) return null;

  const item = youtubevideoData.items[0];
  return {
    title: item.snippet.title,
    durationSeconds: iso8601ToSeconds(item.contentDetails.duration),
    thumbnails: item.snippet.thumbnails,
  };
};

// The official API doesn't give actual video width/height.
// We’ll assume 16:9
export const computeCanvasSize = (targetHeight = 1500) => {
  const height = targetHeight;
  const width = Math.round((targetHeight * 16) / 9);
  return { width, height };
};

export function getPeerTubeVideoID(url: string): string | null {
  const peerTubeRegex = /(?:videos\/watch|w)\/([a-zA-Z0-9-]+)/;
  const match = url.match(peerTubeRegex);
  return match ? match[1] : null;
}

export type YoutubeVideoJson = {
  title: string;
  author_name: string;
  author_url: string;
  type: 'video';
  height: number;
  width: number;
  version: string;
  provider_name: string;
  provider_url: string;
  thumbnail_height: number;
  thumbnail_width: number;
  thumbnail_url: string;
  html: string;
};

export async function getYoutubeJson(
  videoUrl: string,
): Promise<YoutubeVideoJson | undefined> {
  try {
    const normalizedUrl = videoUrl.replace(/^https?:\/\//, '');

    const videoResponse = await fetch(
      `https://www.youtube.com/oembed?url=https://${normalizedUrl}&format=json`,
    );
    return await videoResponse.json();
  } catch (error: any) {
    console.error(`Error getYoutubeJson: ${error.message}`);
  }
}

export async function isImage(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}`, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${response.statusText}`,
      );
    }
    return response.headers.get('Content-Type')?.startsWith('image') || false;
  } catch (error) {
    console.error(`Error getting image: ${error.message}`);
    return false;
  }
}

function iso8601DurationToSeconds(isoDuration: string): number {
  // Regular expression to match ISO 8601 duration format
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);

  if (!matches) {
    throw new Error('Invalid ISO 8601 duration format');
  }

  // Extract hours, minutes, and seconds
  const hours = matches[1] ? parseInt(matches[1], 10) : 0;
  const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
  const seconds = matches[3] ? parseInt(matches[3], 10) : 0;

  // Convert to total seconds
  return hours * 3600 + minutes * 60 + seconds;
}

export async function getVideoDuration(videoUrl: string): Promise<number> {
  try {
    const response = await fetch(videoUrl);
    const html = await response.text();
    console.log('----------------html----------------');
    console.log(html);

    const match = html.match(/itemprop="duration" content="([^"]+)"/)?.[1];
    console.log('----------------match----------------');
    console.log(match);
    if (match) {
      return iso8601DurationToSeconds(match);
    }
    throw new Error('Duration not found in the HTML.');
  } catch (error) {
    throw new Error(`Failed to fetch video duration: ${error.message}`);
  }
}
