import { useEffect } from 'react';

interface UsePostMessageCloseParams {
  enabled: boolean;
  onClose: () => void;
  type?: string; // message payload to listen for
  allowedOrigins?: string[]; // if undefined, accept all origins
}

export function usePostMessageClose({
                                      enabled,
                                      onClose,
                                      type = 'close-annotation-popover',
                                      allowedOrigins,
                                    }: UsePostMessageCloseParams) {
  useEffect(() => {
    if (!enabled) return;

    const handleMessage = (event: MessageEvent) => {
      if (allowedOrigins && !allowedOrigins.includes(event.origin)) return;
      if (event.data === type) onClose();
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [enabled, onClose, type, allowedOrigins]);
}
