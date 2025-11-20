import { Box, IconButton, Popover, styled } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { usePostMessageClose } from '../hooks/usePostMessageClose';

type Size = { width: number; height: number };
type Position = { top: number; left: number };

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

interface DraggableResizablePopoverProps {
  open: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  title: string;
  leftShiftPx?: number;
  minSize?: Size;
  initialSize?: Size;
  allowCrossOriginCloseMessage?: boolean; // defaults true
  closeMessageType?: string; // defaults 'close-annotation-popover'
}

export const DraggableResizablePopover = ({
                                            open,
                                            onClose,
                                            anchorEl,
                                            title,
                                            leftShiftPx = 500,
                                            minSize = { width: 320, height: 200 },
                                            initialSize = { width: 520, height: 360 },
                                            allowCrossOriginCloseMessage = true,
                                            closeMessageType = 'close-annotation-popover',
                                            children,
                                          }: PropsWithChildren<DraggableResizablePopoverProps>) => {
  // state
  const [size, setSize] = useState<Size>(initialSize);
  const [position, setPosition] = useState<Position>({ top: 120, left: 520 });

  // drag/resize refs
  const dragRef = useRef<{ startX: number; startY: number; origTop: number; origLeft: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  // compute initial position when opening
  useEffect(() => {
    if (!open || !anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const initialLeft = Math.max(16, rect.left + rect.width / 2 - size.width / 2 - leftShiftPx);
    const initialTop = Math.max(16, rect.top + rect.height / 2 - size.height / 2);
    setPosition({ top: initialTop, left: initialLeft });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, anchorEl]);

  // message-based close from iframe
  usePostMessageClose({
    enabled: open,
    onClose,
    type: closeMessageType,
    // if you want to restrict, pass an array of allowed origins
    allowedOrigins: allowCrossOriginCloseMessage ? undefined : [],
  });

  // drag handlers
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
    setPosition({
      top: Math.max(0, dragRef.current.origTop + dy),
      left: Math.max(0, dragRef.current.origLeft + dx),
    });
  };

  const onDragEnd = () => {
    dragRef.current = null;
    document.removeEventListener('mousemove', onDragMove);
  };

  // resize handlers
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
    setSize({
      width: Math.max(minSize.width, resizeRef.current.origW + dx),
      height: Math.max(minSize.height, resizeRef.current.origH + dy),
    });
  };

  const onResizeEnd = () => {
    resizeRef.current = null;
    document.removeEventListener('mousemove', onResizeMove);
  };

  // cleanup
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mousemove', onResizeMove);
    };
  }, []);

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: Math.round(position.top), left: Math.round(position.left) }}
      sx={{ zIndex: 1300 }}
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
          {title}
        </Box>
        <CloseButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </CloseButton>
      </TitleBar>

      <Box sx={{ width: '100%', height: 'calc(100% - 36px)' }}>{children}</Box>

      <ResizeHandle onMouseDown={onResizeMouseDown} />
    </Popover>
  );
};
