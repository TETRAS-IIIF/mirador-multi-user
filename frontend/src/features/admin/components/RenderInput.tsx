import { Setting } from '../types/type.ts';
import { FormControlLabel, InputAdornment, Switch, TextField } from '@mui/material';

interface IRenderInputProps {
  setting: Setting;
  handleChange: (settingId: number, newValue: string) => void
}

export const RenderInput = ({ setting, handleChange }: IRenderInputProps) => {
  const isBoolean = setting.value === 'true' || setting.value === 'false';

  if (setting.key === 'MAX_UPLOAD_SIZE') {
    return (
      <TextField
        type="number"
        label="Max Upload Size"
        value={setting.value}
        onChange={e => handleChange(setting.id, e.target.value)}
        InputProps={{
          endAdornment: <InputAdornment position="end">MB</InputAdornment>,
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
        label={setting.key}
      />
    );
  }
  return (
    <TextField
      label={setting.key}
      value={setting.value}
      onChange={e => handleChange(setting.id, e.target.value)}
    />
  );
}