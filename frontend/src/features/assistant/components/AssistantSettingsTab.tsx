import {
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  type AssistantProjectSettings,
  MAX_ASSISTANT_INSTRUCTIONS,
} from '../projectSettings.ts';

/** "Assistant" tab of the project edit modal. */
export function AssistantSettingsTab({
  settings,
  onChange,
  disabled,
}: {
  settings: AssistantProjectSettings;
  onChange: (settings: AssistantProjectSettings) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Stack spacing={2} sx={{ maxWidth: 720 }} data-testid="assistant-settings">
      <FormControlLabel
        control={
          <Switch
            checked={settings.enabled}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...settings, enabled: e.target.checked })
            }
          />
        }
        label={t('assistantSettings.enable')}
      />
      <Typography variant="caption" color="text.secondary">
        {t('assistantSettings.enableHelp')}
      </Typography>
      <TextField
        label={t('assistantSettings.instructions')}
        helperText={t('assistantSettings.instructionsHelp', {
          count: settings.instructions.length,
          max: MAX_ASSISTANT_INSTRUCTIONS,
        })}
        placeholder={t('assistantSettings.instructionsPlaceholder')}
        value={settings.instructions}
        disabled={disabled}
        multiline
        minRows={6}
        maxRows={16}
        slotProps={{ htmlInput: { maxLength: MAX_ASSISTANT_INSTRUCTIONS } }}
        onChange={(e) =>
          onChange({ ...settings, instructions: e.target.value })
        }
      />
    </Stack>
  );
}
