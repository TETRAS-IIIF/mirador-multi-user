import { createTheme } from '@mui/material/styles';
import InputMonoNarrow from '../fonts/InputMonoNarrow-ExtraLight.ttf';
import backgroundImage from '../landing_img.webp';

declare module '@mui/material/styles' {
  interface Palette {
    backgroundImage?: string;
  }

  interface PaletteOptions {
    backgroundImage?: string;
  }
}

export const theme = createTheme({
  typography: {},
  palette: {
    background: {
      default: '#dcdcdc'
    },
    backgroundImage: `url(${backgroundImage})`
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family:'InputMonoNarrow';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          src: local('InputMonoNarrow'), local('InputMonoNarrow-ExtraLight'), url(${InputMonoNarrow}) format('truetype');
          unicodeRange: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF;
        }
      `
    }
  }
});
