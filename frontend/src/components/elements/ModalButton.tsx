import { Button, Tooltip } from '@mui/material';
import { ReactElement } from 'react';

interface IModalButtonProps {
  onClickFunction: () => void,
  disabled: boolean,
  icon: ReactElement
  tooltipButton: string
}

export const ModalButton = ({ tooltipButton, onClickFunction, disabled, icon }: IModalButtonProps) => {

  return (
    <>
      <Tooltip title={tooltipButton}>
        <Button
          disabled={disabled}
          onClick={onClickFunction}
          variant="contained"
        >
          {icon}
        </Button>
      </Tooltip>
    </>
  );
};
