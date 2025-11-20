import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

interface SortSelectorProps<T> {
  sortField: keyof T;
  setSortField: Dispatch<SetStateAction<keyof T>>;
  fields: (keyof T)[];
}

export const SortItemSelector = <T extends Record<string, unknown>>({
  sortField,
  setSortField,
  fields,
}: SortSelectorProps<T>) => {
  const { t } = useTranslation();

  return (
    <FormControl fullWidth sx={{ minWidth: '150px' }}>
      <InputLabel id="sort-selector-label">{t('sort_by')}</InputLabel>
      <Select
        labelId="sort-selector-label"
        value={sortField}
        label={t('sort_by')}
        onChange={(e) => setSortField(e.target.value as keyof T)}
      >
        {fields.map((field) => (
          <MenuItem key={field as string} value={field as string}>
            {t(field as string)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
