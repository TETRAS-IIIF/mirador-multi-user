import { Autocomplete, Box, Chip, Paper, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';

interface AnnotationFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilterCount: number;
  onResetFilters: () => void;
  projectOptions: string[];
  selectedProjects: string[];
  onProjectsChange: (value: string[]) => void;
  creatorOptions: string[];
  selectedCreators: string[];
  onCreatorsChange: (value: string[]) => void;
  tagOptions: string[];
  selectedTags: string[];
  onTagsChange: (value: string[]) => void;
  canvasIdOptions: string[];
  selectedCanvasIds: string[];
  onCanvasIdsChange: (value: string[]) => void;
  dateFrom: Dayjs | null;
  onDateFromChange: (value: Dayjs | null) => void;
  dateTo: Dayjs | null;
  onDateToChange: (value: Dayjs | null) => void;
}

interface MultiSelectFilterProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
}

const MultiSelectFilter = ({
  options,
  value,
  onChange,
  label,
}: MultiSelectFilterProps) => (
  <Autocomplete
    multiple
    options={options}
    value={value}
    onChange={(_, v) => onChange(v)}
    limitTags={2}
    renderTags={(tagValue, getTagProps) =>
      tagValue.map((option, index) => {
        const { key, ...tagProps } = getTagProps({ index });
        return (
          <Chip
            key={key}
            label={option}
            size="small"
            {...tagProps}
            sx={{
              maxWidth: 160,
              '& .MuiChip-label': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            }}
          />
        );
      })
    }
    renderInput={(params) => (
      <TextField {...params} label={label} size="small" />
    )}
    sx={{
      width: 260,
      flexShrink: 0,
    }}
  />
);

export const AnnotationFilters = ({
  searchQuery,
  onSearchChange,
  activeFilterCount,
  onResetFilters,
  projectOptions,
  selectedProjects,
  onProjectsChange,
  creatorOptions,
  selectedCreators,
  onCreatorsChange,
  tagOptions,
  selectedTags,
  onTagsChange,
  canvasIdOptions,
  selectedCanvasIds,
  onCanvasIdsChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: AnnotationFiltersProps) => {
  const { t } = useTranslation();

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label={t('annotations.search')}
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{ width: 300 }}
          />
          {activeFilterCount > 0 && (
            <Chip
              label={`${activeFilterCount} ${t('annotations.activeFilters')}`}
              onDelete={onResetFilters}
              color="primary"
              size="small"
            />
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <MultiSelectFilter
            options={projectOptions}
            value={selectedProjects}
            onChange={onProjectsChange}
            label={t('annotations.filterByProject')}
          />
          <MultiSelectFilter
            options={creatorOptions}
            value={selectedCreators}
            onChange={onCreatorsChange}
            label={t('annotations.filterByCreator')}
          />
          <MultiSelectFilter
            options={tagOptions}
            value={selectedTags}
            onChange={onTagsChange}
            label={t('annotations.filterByTag')}
          />
          <MultiSelectFilter
            options={canvasIdOptions}
            value={selectedCanvasIds}
            onChange={onCanvasIdsChange}
            label={t('annotations.filterByCanvasId')}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={t('annotations.filterDateFrom')}
              value={dateFrom}
              onChange={onDateFromChange}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label={t('annotations.filterDateTo')}
              value={dateTo}
              onChange={onDateToChange}
              slotProps={{ textField: { size: 'small' } }}
            />
          </LocalizationProvider>
        </Box>
      </Box>
    </Paper>
  );
};
