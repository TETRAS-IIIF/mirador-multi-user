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

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Autocomplete
            multiple
            options={projectOptions}
            value={selectedProjects}
            onChange={(_, v) => onProjectsChange(v)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('annotations.filterByProject')}
                size="small"
              />
            )}
            sx={{ minWidth: 200 }}
          />
          <Autocomplete
            multiple
            options={creatorOptions}
            value={selectedCreators}
            onChange={(_, v) => onCreatorsChange(v)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('annotations.filterByCreator')}
                size="small"
              />
            )}
            sx={{ minWidth: 200 }}
          />
          <Autocomplete
            multiple
            options={tagOptions}
            value={selectedTags}
            onChange={(_, v) => onTagsChange(v)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('annotations.filterByTag')}
                size="small"
              />
            )}
            sx={{ minWidth: 200 }}
          />
          <Autocomplete
            multiple
            options={canvasIdOptions}
            value={selectedCanvasIds}
            onChange={(_, v) => onCanvasIdsChange(v)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('annotations.filterByCanvasId')}
                size="small"
              />
            )}
            sx={{ minWidth: 200 }}
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
