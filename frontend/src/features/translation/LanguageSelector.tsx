import { useTranslation } from 'react-i18next';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useEffect, useState } from 'react';
import { loadLanguage } from './loadLanguage.ts';
import { SelectChangeEvent } from '@mui/material';
import { availableLanguages } from './i18n.ts';
import { updatePreferredLanguage } from './api/updatePreferredLanguage.ts';

interface LanguageSelectorProps {
  userId: number;
}

const LanguageSelector = ({ userId }: LanguageSelectorProps) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    setLanguage(i18n.language);
  }, [i18n.language]);

  const handleChange = async (event: SelectChangeEvent<string>) => {
    const selectedLanguage = event.target.value;
    setLanguage(selectedLanguage);
    await loadLanguage(selectedLanguage);
    await updatePreferredLanguage(userId, selectedLanguage);
  };

  return (
    <Select
      value={language}
      onChange={handleChange}
      displayEmpty
      inputProps={{ 'aria-label': 'Select language' }}
    >
      {availableLanguages.map((lang) => (
        <MenuItem key={lang.code} value={lang.code}>
          {lang.label}
        </MenuItem>
      ))}
    </Select>
  );
};

export default LanguageSelector;
