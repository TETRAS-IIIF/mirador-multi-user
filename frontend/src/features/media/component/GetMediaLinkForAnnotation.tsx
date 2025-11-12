import { Button, IconButton, Popover, styled, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useRef, useState } from 'react';
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

const TitleBar = styled('div')(({ theme }) => ({
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 8px 0 12px',
  cursor: 'move',
  userSelect: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
  background: theme.palette.background.paper,
}));

const CloseButton = styled(IconButton)({
  marginLeft: 8,
});

const ResizeHandle = styled('div')({
  position: 'absolute',
  width: 14,
  height: 14,
  right: 0,
  bottom: 0,
  cursor: 'nwse-resize',
  zIndex: 11,
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

  const baseLink = media.path
    ? `${caddyUrl}/${media.hash}/${media.path}`
    : `${media.url}`;
  const mediaLink = isHTMLMediaFile(media) ? `${baseLink}?mode=panel` : baseLink;

  // Popover open/position/size
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 120, left: 120 });
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 520, height: 360 });

  // Refs for drag/resize
  const dragRef = useRef<{ startX: number; startY: number; origTop: number; origLeft: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  // Open at click with slight left offset so it doesn’t overlap the Drawer
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    if (!isHTMLMediaFile(media)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const initialLeft = Math.max(16, rect.left + rect.width / 2 - size.width / 2 - 300); // ~300px left shift
    const initialTop = Math.max(16, rect.top + rect.height / 2 - size.height / 2);
    setPosition({ top: initialTop, left: initialLeft });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  // Drag handlers
  const onTitleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origTop: position.top,
      origLeft: position.left,
    };
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd, { once: true });
  };

  const onDragMove = (e: MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const nextLeft = dragRef.current.origLeft + dx;
    const nextTop = dragRef.current.origTop + dy;
    setPosition({
      top: Math.max(0, nextTop),
      left: Math.max(0, nextLeft),
    });
  };

  const onDragEnd = () => {
    dragRef.current = null;
    document.removeEventListener('mousemove', onDragMove);
  };

  // Resize handlers
  const onResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: size.width,
      origH: size.height,
    };
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd, { once: true });
  };

  const onResizeMove = (e: MouseEvent) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    const nextW = Math.max(320, resizeRef.current.origW + dx);
    const nextH = Math.max(200, resizeRef.current.origH + dy);
    setSize({ width: nextW, height: nextH });
  };

  const onResizeEnd = () => {
    resizeRef.current = null;
    document.removeEventListener('mousemove', onResizeMove);
  };

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mousemove', onResizeMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Optionally check origin if needed for security
      if (event.data === 'close-annotation-popover') {
        handleClose();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  if (isHTMLMediaFile(media)) {
    return (
      <>
        <CustomButton className="overlayButton" disableRipple onClick={handleOpen}>
          {t('openPreview')}
        </CustomButton>

        <Popover
          open={open}
          onClose={handleClose}
          // Use controlled coordinates so we can move the popover freely
          anchorReference="anchorPosition"
          anchorPosition={{ top: Math.round(position.top), left: Math.round(position.left) }}
          // Keep it under the Drawer
          sx={{ zIndex: (theme) => theme.zIndex.drawer - 1 }}
          PaperProps={{
            sx: {
              width: `${size.width}px`,
              height: `${size.height}px`,
              overflow: 'hidden',
              position: 'relative',
              borderRadius: 2,
              boxShadow: 6,
            },
          }}
        >
          <TitleBar onMouseDown={onTitleMouseDown}>
            <Box component="span" sx={{ fontSize: 14, opacity: 0.8 }}>
              {media.title || t('preview')}
            </Box>
            <CloseButton onClick={handleClose} aria-label="close">
              <CloseIcon />
            </CloseButton>
          </TitleBar>

          <Box sx={{ width: '100%', height: `calc(100% - 36px)` }}>
            <iframe
              src={mediaLink}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={media.title}
            />
          </Box>

          <ResizeHandle onMouseDown={onResizeMouseDown} />
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
  if (media.mediaTypes === MediaTypes.OTHER && media.origin === MEDIA_ORIGIN.UPLOAD && media.title) {
    const extension = media.title.split('.').pop()?.toLowerCase();
    const htmlExtensions = ['html', 'htm', 'xhtml'];
    return extension ? htmlExtensions.includes(extension) : false;
  }
  return false;
}
