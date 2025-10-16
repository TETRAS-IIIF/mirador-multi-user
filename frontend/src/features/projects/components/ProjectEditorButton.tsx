import { Button, Tooltip } from "@mui/material";
import ModeEditIcon from "@mui/icons-material/ModeEdit";

interface IProjectEditorButtonProps {
  HandleOpenModal: () => void;
}

export const ProjectEditorButton = ({
  HandleOpenModal,
}: IProjectEditorButtonProps) => {
  return (
    <>
      <Tooltip title={"Project configuration"}>
        <Button disabled={false} onClick={HandleOpenModal} variant="contained">
          <ModeEditIcon/>
        </Button>
      </Tooltip>
    </>
  );
};
