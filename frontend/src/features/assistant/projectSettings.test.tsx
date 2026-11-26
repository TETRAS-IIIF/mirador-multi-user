import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  MAX_ASSISTANT_INSTRUCTIONS,
  readAssistantSettings,
  withAssistantSettings,
} from './projectSettings.ts';
import { AssistantSettingsTab } from './components/AssistantSettingsTab.tsx';

describe('assistant project settings', () => {
  it('reads them from the project metadata, with safe defaults', () => {
    expect(
      readAssistantSettings({
        assistantEnabled: true,
        assistantInstructions: 'Answer in French.',
      }),
    ).toEqual({ enabled: true, instructions: 'Answer in French.' });
    // Only a real `true` enables; anything else is off.
    expect(readAssistantSettings({ assistantEnabled: 'true' })).toEqual({
      enabled: false,
      instructions: '',
    });
    expect(readAssistantSettings(undefined)).toEqual({
      enabled: false,
      instructions: '',
    });
  });

  it('writes them into the metadata and keeps every other key', () => {
    const metadata = {
      creator: 'Anthony',
      title: 'Codex',
      assistantEnabled: false,
    };
    expect(
      withAssistantSettings(metadata, {
        enabled: true,
        instructions: '  Use the tags person, place.  ',
      }),
    ).toEqual({
      creator: 'Anthony',
      title: 'Codex',
      assistantEnabled: true,
      assistantInstructions: 'Use the tags person, place.',
    });
    expect(
      withAssistantSettings(null, {
        enabled: false,
        instructions: 'x'.repeat(MAX_ASSISTANT_INSTRUCTIONS + 10),
      }).assistantInstructions,
    ).toHaveLength(MAX_ASSISTANT_INSTRUCTIONS);
  });
});

describe('AssistantSettingsTab', () => {
  it('edits the switch and the instructions', () => {
    const onChange = vi.fn();
    render(
      <AssistantSettingsTab
        settings={{ enabled: false, instructions: 'a' }}
        onChange={onChange}
      />,
    );
    fireEvent.click(
      screen.getByRole('switch', { name: 'assistantSettings.enable' }),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      enabled: true,
      instructions: 'a',
    });
    fireEvent.change(screen.getByLabelText('assistantSettings.instructions'), {
      target: { value: 'Answer in French.' },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      enabled: false,
      instructions: 'Answer in French.',
    });
  });

  it('is read-only for readers', () => {
    render(
      <AssistantSettingsTab
        settings={{ enabled: true, instructions: 'a' }}
        onChange={vi.fn()}
        disabled
      />,
    );
    expect(
      screen.getByRole('switch', { name: 'assistantSettings.enable' }),
    ).toBeDisabled();
    expect(
      screen.getByLabelText('assistantSettings.instructions'),
    ).toBeDisabled();
  });
});
