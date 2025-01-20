import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Button } from '@mui/material';
import IState from '../../mirador/interface/IState.ts';
import { Project } from '../types/types.ts';

interface IProjectDefaultButtonProps {
  initializeMirador: (miradorState: (IState | undefined), projectUser: Project) => void,
  projectUser: Project,
}


export const ProjectDefaultButton = ({ initializeMirador, projectUser }: IProjectDefaultButtonProps) => {
  return (
    <>
      <Button
        onClick={() => {
          initializeMirador(projectUser.userWorkspace, projectUser);
        }}
        variant="contained"
      >
        <OpenInNewIcon />
      </Button>
    </>
  );
};
