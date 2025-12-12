import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/test-utils';
import { DrawerLinkManifest } from '../component/DrawerLinkManifest.tsx';

vi.mock('react-i18next', async () => {
  const actual =
    await vi.importActual<typeof import('react-i18next')>('react-i18next');

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        changeLanguage: vi.fn(),
        language: 'en',
      },
    }),
  };
});

describe('DrawerLinkManifest', () => {
  it('renders drawer content and keeps submit disabled when link is empty', async () => {
    const toggleModalManifestCreation = vi.fn();
    const linkingManifest = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <DrawerLinkManifest
        modalCreateManifestIsOpen={true}
        toggleModalManifestCreation={toggleModalManifestCreation}
        linkingManifest={linkingManifest}
        isPending={false}
      />,
    );

    const titleAndButton = await screen.findAllByText('linkManifest');
    expect(titleAndButton.length).toBeGreaterThanOrEqual(2);

    expect(screen.getByText(/manifestLink/)).toBeInTheDocument();

    const input = screen.getByPlaceholderText('validURLToManifest');
    expect(input).toBeInTheDocument();

    // Submit button from t('linkManifest') is disabled when no link
    const submitButton = screen.getByRole('button', { name: 'linkManifest' });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit when link is typed and calls linkingManifest on click', async () => {
    const user = userEvent.setup();

    const toggleModalManifestCreation = vi.fn();
    const linkingManifest = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <DrawerLinkManifest
        modalCreateManifestIsOpen={true}
        toggleModalManifestCreation={toggleModalManifestCreation}
        linkingManifest={linkingManifest}
        isPending={false}
      />,
    );

    const input = await screen.findByPlaceholderText('validURLToManifest');
    const submitButton = screen.getByRole('button', { name: 'linkManifest' });

    expect(submitButton).toBeDisabled();

    const url = 'http://example.com/iiif/manifest.json';
    await user.type(input, url);

    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    expect(toggleModalManifestCreation).toHaveBeenCalledTimes(1);

    expect(linkingManifest).toHaveBeenCalledTimes(1);
    expect(linkingManifest).toHaveBeenCalledWith(url);
  });

  it('calls toggleModalManifestCreation when close icon button is clicked', async () => {
    const user = userEvent.setup();

    const toggleModalManifestCreation = vi.fn();
    const linkingManifest = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <DrawerLinkManifest
        modalCreateManifestIsOpen={true}
        toggleModalManifestCreation={toggleModalManifestCreation}
        linkingManifest={linkingManifest}
        isPending={false}
      />,
    );

    const buttons = await screen.findAllByRole('button');
    const closeButton = buttons[0];

    await user.click(closeButton);

    expect(toggleModalManifestCreation).toHaveBeenCalledTimes(1);
    expect(linkingManifest).not.toHaveBeenCalled();
  });
});
