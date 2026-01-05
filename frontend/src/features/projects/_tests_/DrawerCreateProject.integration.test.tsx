import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/test-utils';
import { DrawerCreateProject } from '../components/DrawerCreateProject.tsx';

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

describe('DrawerCreateProject', () => {
  it('submits project name and resets input', async () => {
    const user = userEvent.setup();

    const initializeProjectMock = vi.fn().mockResolvedValue(undefined);
    const toggleModalMock = vi.fn();

    renderWithProviders(
      <DrawerCreateProject
        modalCreateProjectIsOpen={true}
        toggleModalProjectCreation={toggleModalMock}
        InitializeProject={initializeProjectMock}
      />,
    );

    const nameInput = await screen.findByPlaceholderText('placeholderProject');

    await user.type(nameInput, 'My New Project');

    const submitButton = screen.getByRole('button', { name: 'add' });

    await user.click(submitButton);

    expect(initializeProjectMock).toHaveBeenCalledTimes(1);
    expect(initializeProjectMock).toHaveBeenCalledWith('My New Project');

    expect(nameInput).toHaveValue('');
  });

  it('calls toggleModalProjectCreation when close button is clicked', async () => {
    const user = userEvent.setup();

    const initializeProjectMock = vi.fn().mockResolvedValue(undefined);
    const toggleModalMock = vi.fn();

    renderWithProviders(
      <DrawerCreateProject
        modalCreateProjectIsOpen={true}
        toggleModalProjectCreation={toggleModalMock}
        InitializeProject={initializeProjectMock}
      />,
    );

    const buttons = screen.getAllByRole('button');
    const closeButton = buttons[0];

    await user.click(closeButton);

    expect(toggleModalMock).toHaveBeenCalledTimes(1);
  });
});
