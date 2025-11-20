import { Box, Modal } from '@mui/material';

interface ThumbnailPreviewModalProps {
  open: boolean;
  src: string;
  alt?: string;
  onClose: () => void;
}

export const ThumbnailPreviewModal = ({
  open,
  src,
  alt,
  onClose,
}: ThumbnailPreviewModalProps) => (
  <Modal
    open={open}
    onClose={onClose}
    aria-labelledby="manifest-thumbnail-modal"
  >
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0,0,0,0.8)',
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          maxWidth: '100vw',
          maxHeight: '100vh',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />

      <Box
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          cursor: 'pointer',
          color: 'white',
          fontSize: '2rem',
          fontWeight: 700,
          userSelect: 'none',
        }}
      >
        ×
      </Box>
    </Box>
  </Modal>
);
