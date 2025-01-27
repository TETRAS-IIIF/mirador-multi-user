import { Button, ButtonProps, Tooltip } from "@mui/material";
import { ReactElement } from "react";

interface IModalButtonProps {
  onClickFunction: () => void;
  disabled: boolean;
  icon: ReactElement;
  tooltipButton: string;
  color?: ButtonProps["color"];
}

export const ModalButton = ({
  tooltipButton,
  onClickFunction,
  disabled,
  icon,
  color,
}: IModalButtonProps) => {
  return (
    <>
      <Tooltip title={tooltipButton}>
        <Button
          disabled={disabled}
          onClick={onClickFunction}
          variant="contained"
          color={color ? color : "primary"}
        >
          {icon}
        </Button>
      </Tooltip>
    </>
  );
};
