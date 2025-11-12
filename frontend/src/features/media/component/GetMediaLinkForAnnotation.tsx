import { Button, styled, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Media } from '../types/types.ts';
import { caddyUrl } from '../../../utils/utils.ts';
import { isHTMLMediaFile } from '../utils/utils.ts';
import { DraggableResizablePopover } from './DraggableResizablePopover';

const OverlayActions = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  gap: 8,
  opacity: 0,
  transition: 'opacity 0.3s ease',
  textAlign: 'center',
});

const ActionButton = styled(Button)({
  pointerEvents: 'auto',
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
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const baseLink = media.path ? `${caddyUrl}/${media.hash}/${media.path}` : `${media.url}`;
  const previewLink = isHTMLMediaFile(media) ? `${baseLink}?mode=panel` : baseLink;

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    if (!isHTMLMediaFile(media)) return;
    setAnchorEl(e.currentTarget);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  if (isHTMLMediaFile(media)) {
    return (
      <>
        <OverlayActions className="overlayButton">
          <ActionButton variant="contained" disableRipple onClick={handleOpen}>
            {t('openPreview')}
          </ActionButton>
          <ActionButton
            variant="outlined"
            disableRipple
            onClick={() => handleCopyToClipBoard(baseLink)} // copy canonical URL
          >
            {t('copyToClipboard')}
          </ActionButton>
        </OverlayActions>

        <DraggableResizablePopover
          open={open}
          onClose={handleClose}
          anchorEl={anchorEl}
          title={media.title || t('preview')}
          leftShiftPx={600}
          minSize={{ width: 320, height: 200 }}
          initialSize={{ width: 520, height: 360 }}
        >
          <iframe
            src={previewLink}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={media.title}
          />
        </DraggableResizablePopover>
      </>
    );
  }

  return (
    <OverlayActions className="overlayButton">
      <ActionButton
        variant="outlined"
        disableRipple
        onClick={() => handleCopyToClipBoard(baseLink)}
      >
        {t('copyToClipboard')}
      </ActionButton>
    </OverlayActions>
  );
};
