import { useState } from 'react';
import { Box, Button, FormControlLabel, Grid, Switch, TextField, Typography } from '@mui/material';
import { Setting } from '../types/type.ts';

interface IMutableSettingsEditorProps {
  settings: Setting[];
  onSave: (settings: Setting[]) => void;
}

export const MutableSettingsEditor = ({ settings, onSave }: IMutableSettingsEditorProps) => {
  const [editableSettings, setEditableSettings] = useState<Setting[]>([...settings]);

  const handleChange = (id: number, newValue: string) => {
    setEditableSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, value: newValue } : setting,
      ),
    );
  };

  const renderInput = (setting: Setting) => {
    const isBoolean = setting.value === 'true' || setting.value === 'false';

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
        fullWidth
        label={setting.key}
        value={setting.value}
        onChange={e => handleChange(setting.id, e.target.value)}
      />
    );
  }

  return (
    <Grid container sx={{ p: 3 }}>
      <Grid item>

        <Typography variant="h6" gutterBottom>
          Mutable Settings
        </Typography>
      </Grid>
      <Grid container item spacing={2}>
        {editableSettings.map(setting => (
          <Grid item xs={12} sm={6} key={setting.id}>
            {renderInput(setting)}
          </Grid>
        ))}
      </Grid>
      <Box mt={3} textAlign="right">
        <Button
          variant="contained"
          color="primary"
          onClick={() => onSave(editableSettings)}
        >
          Save Changes
        </Button>
      </Box>
    </Grid>
  );
}