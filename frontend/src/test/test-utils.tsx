import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { I18nextProvider } from 'react-i18next';

import { theme } from '../assets/theme/mainTheme';
import i18n from '../features/translation/i18n';

const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export function renderWithProviders(ui: ReactElement) {
  return render(
    <QueryClientProvider client={testQueryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {ui}
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}
