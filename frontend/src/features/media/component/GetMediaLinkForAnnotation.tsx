import { Button, IconButton, Popover, styled } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
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

const CloseButton = styled(IconButton)({
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 10,
});

interface IGetMediaLinkForAnnotationProps {
  media: Media;
  handleCopyToClipBoard: (path: string) => void;
}

export const GetMediaLinkForAnnotation = ({
                                            media,
                                            handleCopyToClipBoard,
                                          }: IGetMediaLinkForAnnotationProps) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const baseLink = media.path
    ? `${caddyUrl}/${media.hash}/${media.path}`
    : `${media.url}`;
  const mediaLink = isHTMLMediaFile(media)
    ? `${baseLink}?mode=panel`
    : baseLink;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  if (isHTMLMediaFile(media)) {
    return (
      <>
        <CustomButton
          className="overlayButton"
          disableRipple
          onClick={handleOpen}
        >
          {t('openPreview')}
        </CustomButton>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
          transformOrigin={{ vertical: 'center', horizontal: 'center' }}
          // Ensure the popover renders *under* the Drawer (Drawer default zIndex: 1200)
          sx={{ zIndex: (theme) => theme.zIndex.drawer - 1 }}
          PaperProps={{
            sx: {
              width: '40vw',
              maxWidth: 720,
              minWidth: 360,
              height: '45vh',
              maxHeight: 600,
              minHeight: 280,
              overflow: 'hidden',
              position: 'relative',
              borderRadius: 2,
            },
          }}
        >
          <CloseButton onClick={handleClose} aria-label="close">
            <CloseIcon />
          </CloseButton>

          <iframe
            src={mediaLink}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={media.title}
          />
        </Popover>
      </>
    );
  }

  return (
    <CustomButton
      className="overlayButton"
      disableRipple
      onClick={() => handleCopyToClipBoard(mediaLink)}
    >
      {t('copyToClipboard')}
    </CustomButton>
  );
};

function isHTMLMediaFile(media: Media): boolean {
  if (
    media.mediaTypes === MediaTypes.OTHER &&
    media.origin === MEDIA_ORIGIN.UPLOAD &&
    media.title
  ) {
    const extension = media.title.split('.').pop()?.toLowerCase();
    const htmlExtensions = ['html', 'htm', 'xhtml'];
    return extension ? htmlExtensions.includes(extension) : false;
  }
  return false;
}
