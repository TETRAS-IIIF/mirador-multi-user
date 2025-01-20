import { Fab } from '@mui/material';
import { ReactNode } from 'react';

interface IFloatingActionButtonProps {
  content: string;
  Icon: ReactNode;
  onClick: () => void;
}

const FabStyle = {
  margin: 0,
  top: 'auto',
  right: 30,
  bottom: 30,
  left: 'auto',
  position: 'fixed'
};

export const FloatingActionButton = ({ content, Icon, onClick }: IFloatingActionButtonProps) => {

  return (
    <>
      <Fab
        variant="extended"
        color="primary"
        sx={FabStyle}
        onClick={onClick}
      >
        {Icon}
        {content}
      </Fab>
    </>
  );
};
