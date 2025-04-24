import { Setting } from '../types/type.ts';
import { FormControlLabel, InputAdornment, Switch, TextField, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface IRenderInputProps {
  setting: Setting;
  handleChange: (settingId: number, newValue: string) => void
}

export const RenderInput = ({ setting, handleChange }: IRenderInputProps) => {
  const isBoolean = setting.value === 'true' || setting.value === 'false';
  const { t } = useTranslation();


  const keyMap: Record<string, string> = {
    ALLOW_NEW_USER: 'display_user_inscription_page',
    OPEN_ID_CONNECT_ALLOWED: 'openid_connect',
  };

  const tKey = keyMap[setting.key] || setting.key.toLowerCase();
  const label = t(tKey, { defaultValue: setting.key });
  const tooltip = t(`${tKey}_tooltip`, { defaultValue: '' });

  if (isBoolean || setting.key === 'OPEN_ID_CONNECT_ALLOWED') {
    return (
      <Tooltip title={tooltip} placement="top" arrow>
        <FormControlLabel
          control={
            <Switch
              checked={setting.value === 'true' || setting.value === '1'}
              onChange={e =>
                handleChange(setting.id, e.target.checked ? '1' : '0')
              }
            />
          }
          label={label}
        />
      </Tooltip>
    );
  }
  
  if (setting.key === 'MAX_UPLOAD_SIZE') {
    return (
      <Tooltip title={tooltip} placement="top" arrow>
        <TextField
          type="number"
          label={label}
          value={setting.value}
          onChange={e => handleChange(setting.id, e.target.value)}
          InputProps={{
            endAdornment: <InputAdornment position="end">{t('mb')}</InputAdornment>,
          }}
          inputProps={{ min: 1 }}
        />
      </Tooltip>
    );
  }
  if (isBoolean) {
    return (
      <Tooltip title={tooltip} placement="top" arrow>
        <FormControlLabel
          control={
            <Switch
              checked={setting.value === 'true'}
              onChange={e => handleChange(setting.id, e.target.checked.toString())}
            />
          }
          label={label}
        />
      </Tooltip>
    );
  }
  return (
    <Tooltip title={tooltip} placement="top" arrow>
      <TextField
        fullWidth
        label={label}
        value={setting.value}
        onChange={e => handleChange(setting.id, e.target.value)}
      />
    </Tooltip>
  );
}