import { Button, styled } from '@mui/material';
import { Media, MEDIA_ORIGIN, MediaTypes } from '../types/types.ts';
import { useTranslation } from 'react-i18next';
import { caddyUrl } from '../../../utils/utils.ts';

const CustomButton = styled(Button)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  opacity: 0,
  transition: 'opacity 0.3s ease',
});

interface IGetMediaLinkForAnnotationProps {
  media: Media;
  handleCopyToClipBoard: (path: string) => void;
}

export const GetMediaLinkForAnnotation = ({
  media,
  handleCopyToClipBoard,
} : IGetMediaLinkForAnnotationProps ) => {

  const { t } = useTranslation();

  const mediaLink =  media.path
    ? `${caddyUrl}/${media.hash}/${media.path}`
    : `${media.url}` ;

  if(isHTMLMediaFile(media)){
    return (
      // Popover containing an iframe to mediaLink

      // TODO
    )
  }

  return (
    <CustomButton
      className="overlayButton"
      disableRipple
      onClick={() =>
        handleCopyToClipBoard(
          mediaLink
        )
      }>
      {t('copyToClipboard')}
    </CustomButton>
  )

}

function isHTMLMediaFile(media: Media): boolean {
  if (media.mediaTypes === MediaTypes.OTHER &&
    media.origin === MEDIA_ORIGIN.UPLOAD &&
    media.title) {
    const extension = media.title.split('.').pop()?.toLowerCase();
    const htmlExtensions = ['html', 'htm', 'xhtml'];
    return extension ? htmlExtensions.includes(extension) : false;
  }
  return false;
}
