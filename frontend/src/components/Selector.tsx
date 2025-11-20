import { useTranslation } from 'react-i18next';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';
import { ITEM_RIGHTS } from '../utils/mmu_types.ts';

export interface SelectorProps {
  value: string;
  onChange?: (event: SelectChangeEvent) => void;
  rights: ITEM_RIGHTS[];
}

export const Selector = ({
  value = ITEM_RIGHTS.READER,
  onChange,
  rights,
}: SelectorProps) => {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(value);

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
        renderValue={() => t(localValue)}
      >
        {Object.values(rights).map((item) => (
          <MenuItem key={item} value={item}>
            {t(item)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
