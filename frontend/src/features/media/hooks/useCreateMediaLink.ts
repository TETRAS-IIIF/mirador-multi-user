import { useMutation } from '@tanstack/react-query';
import { createMediaLink } from '../api/createMediaWithLink.ts';
import { LinkMediaDto } from '../types/types.ts';

export const useCreateMediaLink = () => {
  return useMutation({
    mutationFn: (mediaLinkDto: LinkMediaDto) => createMediaLink(mediaLinkDto),
  });
};
