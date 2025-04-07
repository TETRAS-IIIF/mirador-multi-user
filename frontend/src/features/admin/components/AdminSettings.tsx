import { Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { Settings } from '../types/type.ts';
import { fetchBackendAPIConnected } from '../../../utils/fetchBackendAPI.ts';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { MutableSettingsEditor } from './MutableSettingsEditor.tsx';

export const AdminSettings = () => {
  const [settings, setSettings] = useState<Settings>()
  const { t } = useTranslation();

  const fetchSettings = async () => {
    const responseSettings = await fetchBackendAPIConnected(
      'settings',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      undefined,
      () => {
        toast.error(t('error_fetch_settings'));
      },
    );
    setSettings(responseSettings);
  };

  useEffect(() => {
    fetchSettings()
  }, [])

  console.log('settings :', settings)

  return (
    <Grid container spacing={2}>
      <Grid item>
        {
          settings && (
            <MutableSettingsEditor
              settings={settings.mutableSettings}
              onSave={updated => {
                console.log('Updated settings:', updated);
              }}
            />
          )
        }

      </Grid>
    </Grid>
  )
}