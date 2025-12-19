import { createTheme } from '@mui/material/styles';
import { theme as baseTheme } from '../assets/theme/mainTheme';

export const testTheme = createTheme({
  ...baseTheme,
  components: {
    ...baseTheme.components,
    MuiButtonBase: {
      ...(baseTheme.components?.MuiButtonBase ?? {}),
      defaultProps: {
        ...(baseTheme.components?.MuiButtonBase?.defaultProps ?? {}),
        disableRipple: true,
      },
    },
  },
  transitions: {
    ...baseTheme.transitions,
    duration: {
      shortest: 0,
      shorter: 0,
      short: 0,
      standard: 0,
      complex: 0,
      enteringScreen: 0,
      leavingScreen: 0,
    },
  },
});
