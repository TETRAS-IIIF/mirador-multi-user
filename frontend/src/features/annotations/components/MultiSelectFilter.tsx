import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  ListItem,
  TextField,
  Tooltip,
} from '@mui/material';

interface MultiSelectFilterProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
}

export const MultiSelectFilter = ({
  options,
  value,
  onChange,
  label,
}: MultiSelectFilterProps) => {
  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      limitTags={2}
      options={options}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      size="small"
      sx={{
        width: 240,
        flexShrink: 0,
      }}
      renderOption={(props, option, { selected }) => {
        const { key, ...optionProps } = props as typeof props & {
          key: string;
        };
        return (
          <Tooltip key={key} title={option} placement="right">
            <ListItem {...optionProps} dense>
              <Checkbox
                icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                checkedIcon={<CheckBoxIcon fontSize="small" />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              <Box
                component="span"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {option}
              </Box>
            </ListItem>
          </Tooltip>
        );
      }}
      renderTags={(selected, getTagProps) =>
        selected.map((option, index) => {
          const { key, ...tagProps } = getTagProps({ index });
          return (
            <Tooltip key={key} title={option} placement="top">
              <Chip
                {...tagProps}
                label={option}
                size="small"
                sx={{ maxWidth: 120 }}
              />
            </Tooltip>
          );
        })
      }
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={label} />
      )}
      slotProps={{
        paper: {
          sx: { '& .MuiAutocomplete-listbox': { maxHeight: 300 } },
        },
      }}
    />
  );
};
