import { Box,  ImageListItemBar } from '@mui/material';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import ImageIcon from '@mui/icons-material/Image';
import { Media } from '../types/types';
import placeholder from '../../../assets/Placeholder.svg';
import videoPlaceHolder from '../../../assets/video_placeholder.webp';
import otherPlaceHolder from '../../../assets/other_placeholder.webp';
import { GetMediaLinkForAnnotation } from './GetMediaLinkForAnnotation.tsx';
import { CustomImageItem } from './CustomImageItem.tsx';
import { MEDIA_TYPES } from '../../../utils/mmu_types.ts';


interface ImageBoxProps {
  media: Media;
  caddyUrl: string;
  handleCopyToClipBoard: (path: string) => void;
}

export const MediaImageBox = ({
  media,
  caddyUrl,
  handleCopyToClipBoard,
}: ImageBoxProps) => {

  const thumbnailUrl = (): string | undefined => {
    if (media.mediaTypes === MEDIA_TYPES.IMAGE) {
      return media.hash
        ? `${caddyUrl}/${media.hash}/thumbnail.webp`
        : placeholder;
    }
    if (media.mediaTypes === MEDIA_TYPES.VIDEO) {
      return media.hash
        ? `${caddyUrl}/${media.hash}/thumbnail.webp`
        : videoPlaceHolder;
    }
    if (media.mediaTypes === MEDIA_TYPES.OTHER) {
      return otherPlaceHolder;
    }
    return undefined;
  };
  return (
    <CustomImageItem key={media.id}>
      <Box
        component="img"
        src={thumbnailUrl()}
        alt={media.title}
        loading="lazy"
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          '@media(min-resolution: 2dppx)': {
            width: '100%',
            height: '100%',
          },
        }}
      />
      <ImageListItemBar
        title={media.title}
        sx={{
          position: 'absolute',
          bottom: 0,
          color: 'white',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {media.mediaTypes === MEDIA_TYPES.VIDEO ? (
          <OndemandVideoIcon />
        ) : (
          <ImageIcon />
        )}
      </Box>
      <GetMediaLinkForAnnotation
        media={media}
        handleCopyToClipBoard={handleCopyToClipBoard}/>
    </CustomImageItem>
  );
};
