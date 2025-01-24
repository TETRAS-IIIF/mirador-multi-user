import { IconButton, styled } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

interface SideDrawerHeaderProps {
  isSideDrawerExpanded: boolean;
  handleDrawerClose: () => void;
  handleDrawerOpen: () => void;
}

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

/**
 * SideDrawerHeader component
 * Display the header of the side drawer. This header allow to reduce/expand the side drawer
 * @param open
 * @param handleDrawerClose
 * @param handleDrawerOpen
 * @constructor
 */
export function SideDrawerHeader({
                                   isSideDrawerExpanded,
                                   handleDrawerClose,
                                   handleDrawerOpen
                                 }: SideDrawerHeaderProps) {
  return <DrawerHeader>
    <IconButton
      onClick={isSideDrawerExpanded ? handleDrawerClose : handleDrawerOpen}
    >
      {!isSideDrawerExpanded ? <ChevronRightIcon /> : <ChevronLeftIcon />}
    </IconButton>
  </DrawerHeader>;
}
