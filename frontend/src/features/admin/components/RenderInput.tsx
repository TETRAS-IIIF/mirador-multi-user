import { Setting } from '../types/type.ts';
import { FormControlLabel, InputAdornment, Switch, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface IRenderInputProps {
  setting: Setting;
  handleChange: (settingId: number, newValue: string) => void
}

export const RenderInput = ({ setting, handleChange }: IRenderInputProps) => {
  const isBoolean = setting.value === 'true' || setting.value === 'false';
  const { t } = useTranslation();

  if (setting.key === 'MAX_UPLOAD_SIZE') {
    return (
      <TextField
        type="number"
        label={t('max_upload_size')}
        value={setting.value}
        onChange={e => handleChange(setting.id, e.target.value)}
        InputProps={{
          endAdornment: <InputAdornment position="end">{t('mb')}</InputAdornment>,
        }}
        inputProps={{
          min: 1,
        }}
      />
    );
  }
  if (isBoolean) {
    return (
      <FormControlLabel
        control={
          <Switch
            checked={setting.value === 'true'}
            onChange={e => handleChange(setting.id, e.target.checked.toString())}
          />
        }
        label={t(setting.key.toLowerCase())}
      />
    );
  }
  return (
    <TextField
      label={t(setting.key.toLowerCase())}
      value={setting.value}
      onChange={e => handleChange(setting.id, e.target.value)}
    />
  );
}