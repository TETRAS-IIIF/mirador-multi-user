import { Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { getAdminSettings } from '../api/getAdminSettings.ts';

export const AdminSettings = () => {
  const [settings, setSettings] = useState()

  const handleGetAdminSettings = async () => {
    const settingRequest = await getAdminSettings()
    setSettings(settingRequest)
  }
  useEffect(() => {
    handleGetAdminSettings()
  }, [])

  console.log('settings :', settings)

  return (
    <Grid container spacing={2}>
      <Grid item>
        coco
      </Grid>
    </Grid>
  )
}