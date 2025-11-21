import { styled } from '@mui/material';

export const CustomImageItem = styled('div')({
  position: 'relative',
  height: 200,
  overflow: 'hidden',

  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  '&:hover img': {
    opacity: 0.4,
  },
  '&:hover .overlayButton': {
    opacity: 1,
  },
});
