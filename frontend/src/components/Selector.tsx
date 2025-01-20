import { useTranslation } from 'react-i18next';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useEffect, useState } from 'react';

export interface SelectorItem {
  id: string;
  name: string;
}

export interface SelectorProps {
  selectorItems: SelectorItem[];
  value: string;
  onChange?: (event: SelectChangeEvent) => void;
}

export const Selector = ({ selectorItems, value, onChange }: SelectorProps) => {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(
    selectorItems.find((item) => item.id.toUpperCase() === value?.toUpperCase())?.id || selectorItems[0]?.id
  );
  useEffect(() => {
    setLocalValue(
      selectorItems.find((item) => item.id.toUpperCase() === value?.toUpperCase())?.id || selectorItems[0]?.id
    );
  }, [value]);

  const handleLocalChange = (event: SelectChangeEvent<string>) => {
    const newValue = event.target.value;
    setLocalValue(newValue);
    if (onChange) {
      onChange(event);
    }
  };
  return (
    <FormControl sx={{ width: 120, mb: 1 }} size="small">
      <Select
        value={localValue}
        onChange={handleLocalChange}
        renderValue={(selected) => t(selectorItems.find((item) => item.id === selected)?.name || '')}
      >
        {selectorItems.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {t(item.name)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
