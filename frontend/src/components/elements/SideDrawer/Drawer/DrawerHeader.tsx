import { IconButton, styled } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

interface DrawerHeaderProps {
  isSideDrawerExpanded: boolean;
  handleDrawerClose: () => void;
  handleDrawerOpen: () => void;
}

const StyledDrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

export function DrawerHeader({
  isSideDrawerExpanded,
  handleDrawerClose,
  handleDrawerOpen,
}: DrawerHeaderProps) {
  return (
    <StyledDrawerHeader>
      <IconButton
        onClick={isSideDrawerExpanded ? handleDrawerClose : handleDrawerOpen}
      >
        {!isSideDrawerExpanded ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </IconButton>
    </StyledDrawerHeader>
  );
}
