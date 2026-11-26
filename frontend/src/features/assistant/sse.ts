/**
 * Minimal Server-Sent Events parser for fetch() streams (EventSource can't
 * POST or send an Authorization header). Feed it text chunks; it calls
 * `onEvent` with each complete `data:` payload parsed as JSON.
 */
export function createSseParser(onEvent: (data: unknown) => void) {
  let buffer = '';
  return (chunk: string) => {
    buffer += chunk.replace(/\r\n/g, '\n');
    let boundary = buffer.indexOf('\n\n');
    while (boundary >= 0) {
      const raw = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = raw
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).replace(/^ /, ''))
        .join('\n');
      if (data) {
        try {
          onEvent(JSON.parse(data));
        } catch {
          // Ignore malformed events rather than breaking the stream.
        }
      }
      boundary = buffer.indexOf('\n\n');
    }
  };
}
