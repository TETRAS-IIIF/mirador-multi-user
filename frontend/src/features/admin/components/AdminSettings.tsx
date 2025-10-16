import { useEffect, useState } from 'react';
import { Settings } from '../types/type.ts';
import { fetchBackendAPIConnected } from '../../../utils/fetchBackendAPI.ts';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { UnMutableSettingsViewer } from './UnMutableSettingsViewer.tsx';
import { MutableSettingsEditor } from './MutableSettingsEditor.tsx';
import dayjs from 'dayjs';
import { AdminActions } from './AdminActions.tsx';

export const AdminSettings = () => {
  const [settings, setSettings] = useState<Settings>()
  const { t, i18n } = useTranslation();

  const fetchSettings = async () => {
    const responseSettings: Settings = await fetchBackendAPIConnected(
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
    const formattedUnMutableSettings = responseSettings.unMutableSettings.map(([key, value]) => {
      if (['LAST_STARTING_TIME', 'LAST_MIGRATION'].includes(key)) {
        return [
          key,
          dayjs(value)
            .locale(i18n.language)
            .format('LLLL')
            .toString(),
        ] as [string, string];
      }

      return [key, value] as [string, string];
    });
    setSettings({ ...responseSettings, unMutableSettings: formattedUnMutableSettings });
  };

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <>
      {
        settings && (
          <>
            <MutableSettingsEditor
              settings={settings.mutableSettings}/>
            <AdminActions/>
            <UnMutableSettingsViewer settings={settings.unMutableSettings}/>
          </>
        )
      }
    </>
  )
}