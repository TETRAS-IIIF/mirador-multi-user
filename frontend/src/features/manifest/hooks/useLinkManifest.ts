import { useMutation } from '@tanstack/react-query';
import { linkManifest } from '../api/linkManifest.ts';
import { UploadAndLinkManifestDto } from '../types/types.ts';

export const useLinkManifest = () => {
  return useMutation({
    mutationFn: (linkManifestDto: UploadAndLinkManifestDto) =>
      linkManifest(linkManifestDto),
  });
};
