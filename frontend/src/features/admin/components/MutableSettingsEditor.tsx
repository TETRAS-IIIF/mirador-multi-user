import { useState } from 'react';
import { Grid, Typography } from '@mui/material';
import { Setting, Settings } from '../types/type.ts';
import { RenderInput } from './RenderInput.tsx';
import { fetchBackendAPIConnected } from '../../../utils/fetchBackendAPI.ts';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

interface IMutableSettingsEditorProps {
  settings: Setting[];
}

export const MutableSettingsEditor = ({ settings }: IMutableSettingsEditorProps) => {
  const [editableSettings, setEditableSettings] = useState<Setting[]>([...settings]);
  const queryClient = useQueryClient();

  const { t } = useTranslation();

  const handleRefreshSettings = async () => {
    await queryClient.refetchQueries({ queryKey: ['adminSettings'] });
    queryClient.getQueryData<Settings>(['adminSettings']);
  };

  const handleChange = async (id: number, newValue: string) => {
    const settingToUpdate = editableSettings.find(s => s.id === id);
    if (!settingToUpdate) return;

    await fetchBackendAPIConnected(
      'settings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: settingToUpdate.key,
          value: newValue,
        }),
      },
      () => {
        toast.success(
          t('setting_updated'),
        )
        handleRefreshSettings()
      },
      () => {
        toast.error(
          t('error_update_settings'),
        )
      },
    )

    setEditableSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, value: newValue } : setting,
      ),
    );
  };

  return (
    <Grid container sx={{ p: 3 }}>
      <Grid>
        <Typography variant="h6" gutterBottom>
          Mutable Settings
        </Typography>
      </Grid>
      <Grid container flexDirection="column" spacing={2}>
        {editableSettings.map(setting => (
          <Grid key={setting.id}>
            <RenderInput setting={setting} handleChange={handleChange}/>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
}