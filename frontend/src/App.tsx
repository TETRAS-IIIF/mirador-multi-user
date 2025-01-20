import './App.css';
import { AppProvider } from 'providers/app-provider.tsx';
import { AppRoutes } from 'routes/routes.tsx';
import { Toaster } from 'react-hot-toast';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from './assets/theme/mainTheme.ts';
import { I18nextProvider } from 'react-i18next';
import i18n from './features/translation/i18n.ts';

function App() {

  document.title = import.meta.env.VITE_INSTANCE_SHORT_NAME;

  return (
    <I18nextProvider i18n={i18n}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <AppProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppRoutes />
          </ThemeProvider>
        </AppProvider>
        <Toaster />
      </div>
    </I18nextProvider>
  );
}

export default App;
