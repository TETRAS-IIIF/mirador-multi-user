import { styled } from '@mui/material';

export const CustomImageItem = styled('div')({
  position: 'relative',
  '&:hover img': {
    opacity: 0.4,
  },
  '&:hover .overlayButton': {
    opacity: 1,
  },
});
