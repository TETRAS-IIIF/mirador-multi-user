// src/test/test-utils.tsx
import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { CssBaseline, ThemeProvider } from '@mui/material';

import { AppProvider } from 'providers/app-provider';
import { theme } from '../assets/theme/mainTheme';
import { I18nextProvider } from 'react-i18next';
import i18n from '../features/translation/i18n';

export function renderWithProviders(ui: ReactElement) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AppProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {ui}
        </ThemeProvider>
      </AppProvider>
    </I18nextProvider>,
  );
}
