import { Button } from '@mui/material';
import ModeEditIcon from '@mui/icons-material/ModeEdit';

interface IProjectReaderButtonProps {
  HandleOpenModal: () => void;
}

export const ProjectReaderButton = ({ HandleOpenModal }: IProjectReaderButtonProps) => {
  return (
    <Button
      disabled={true}
      onClick={HandleOpenModal}
      variant="contained"
    >
      <ModeEditIcon />
    </Button>
  );
};
