import Modal from '@mui/material/Modal';
import { Box, DialogTitle, IconButton } from '@mui/material';
import { ReactNode } from 'react';
import CloseIcon from '@mui/icons-material/Close';

interface IOpenModalProps {
  openModal: boolean,
  setOpenModal: () => void,
  children: ReactNode,
  width: number
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3,
  zIndex: 1300
};

export const MMUModal = ({ openModal, setOpenModal, children, width }: IOpenModalProps) => {
  return (
    <Modal
      open={openModal}

      onClose={setOpenModal}
      aria-labelledby="child-modal-title"
      aria-describedby="child-modal-description"
      slotProps={{
        backdrop: {
          sx: { zIndex: 800 }
        }
      }}
      sx={{ zIndex: 1300, overflow: 'scroll' }}
    >
      <Box sx={{ ...style, width: width }}>
        <DialogTitle id="id" sx={{ padding: 0 }}>
          <Box display="flex" alignItems="center" justifyContent="flex-end">
            <Box>
              <IconButton onClick={setOpenModal} sx={{ padding: 0 }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        {children}
      </Box>
    </Modal>
  );
};
