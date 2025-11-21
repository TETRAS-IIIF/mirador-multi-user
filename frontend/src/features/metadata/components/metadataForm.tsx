import {
  Box,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import MetadataField from './metadataField.tsx';
import { OBJECT_ORIGIN } from '../../../utils/mmu_types.ts';

interface MetadataFormProps<T> {
  handleSetMetadataFormData: (data: any) => void;
  item: T;
  metadataFormats: MetadataFormat[];
  loading: boolean;
  selectedMetadataFormat: MetadataFormat | undefined;
  setSelectedMetadataFormat: (newFormat: MetadataFormat | undefined) => void;
  selectedMetadataData: MetadataFields | undefined;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

type MetadataFields = {
  [key: string]: string;
};

type MetadataFormat = {
  id: number;
  title: string;
  creatorId: number;
  metadata: MetadataFormatField[];
};

type MetadataFormatField = {
  term: string;
  label: string;
  uri: string;
  definition: string;
  comment?: string;
};

export const MetadataForm = <T extends { id: number }>({
  handleFileChange,
  selectedMetadataData,
  setSelectedMetadataFormat,
  selectedMetadataFormat,
  loading,
  metadataFormats,
  handleSetMetadataFormData,
  item,
}: MetadataFormProps<T>) => {
  const [generatingFields, setGeneratingFields] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleInputChange = useCallback(
    (term: string, value: string | null | undefined) => {
      const newValue = value ?? '';
      handleSetMetadataFormData({
        ...selectedMetadataData,
        [term]: newValue,
      });
    },
    [selectedMetadataData],
  );

  const doesItemContainMetadataField = (fieldTerm: string): boolean => {
    return Object.keys(item).some(
      (itemKey) => itemKey.toLowerCase() === fieldTerm.toLowerCase(),
    );
  };

  const handleFormatChange = async (event: SelectChangeEvent) => {
    setGeneratingFields(true);
    const selectedFormatTitle = event.target.value;
    if (selectedFormatTitle === OBJECT_ORIGIN.UPLOAD) {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }
    const selectedFormat = metadataFormats.find(
      (format) => format.title === selectedFormatTitle,
    );
    setSelectedMetadataFormat(selectedFormat || undefined);
    setTimeout(() => {
      setGeneratingFields(false);
    }, 300);
  };

  const shouldDisplayField = (field: any): boolean => {
    if (field.term.toLowerCase() === 'date' && 'created_at' in item)
      return false;
    if (field.term.toLowerCase() === 'creator' && 'ownerId' in item)
      return false;
    return !doesItemContainMetadataField(field.term);
  };

  const handleExampleMetadata = () => {
    const fileUrl = '/exampleMetadata.json';
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = 'exampleMetadata.json';
    link.click();
  };

  useEffect(() => {}, [selectedMetadataFormat]);
  return (
    <Grid
      container
      sx={{
        overflowY: 'auto',
        width: '100%',
      }}
    >
      {loading ? (
        <Grid container alignItems="center" justifyContent="center">
          <CircularProgress />
        </Grid>
      ) : (
        <Box
          sx={{
            overflowY: 'auto',
            width: '100%',
            height: '100%',
          }}
        >
          <Box sx={{ minWidth: 120, paddingTop: 2, paddingBottom: 2 }}>
            <FormControl sx={{ width: '90%' }}>
              <InputLabel id="metadata-format-label">Format</InputLabel>
              <Select
                labelId="metadata-format-label"
                value={
                  selectedMetadataFormat ? selectedMetadataFormat.title : ''
                }
                label="Format"
                onChange={handleFormatChange}
              >
                <MenuItem value="upload">
                  ... Upload new metadata template
                </MenuItem>
                <MenuItem
                  value="download-example"
                  onClick={handleExampleMetadata}
                >
                  ... Download metadata templates example
                </MenuItem>
                {metadataFormats.map((metadataFormat) => (
                  <MenuItem
                    divider={true}
                    key={metadataFormat.id}
                    value={metadataFormat.title}
                  >
                    {metadataFormat.title}
                  </MenuItem>
                ))}
              </Select>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                onChange={handleFileChange}
                accept="application/json"
              />
            </FormControl>
            <Divider sx={{ paddingBottom: 2 }} />
          </Box>
          {selectedMetadataData && selectedMetadataFormat ? (
            <form style={{ width: '100%' }}>
              {generatingFields ? (
                <Grid container alignItems="center" justifyContent="center">
                  <CircularProgress />
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  {selectedMetadataFormat?.metadata
                    .filter(shouldDisplayField)
                    .map((field) => (
                      <MetadataField
                        key={field.term}
                        field={field}
                        value={
                          (selectedMetadataData[
                            field.term
                          ] as unknown as string) || ''
                        }
                        handleInputChange={handleInputChange}
                      />
                    ))}
                </Grid>
              )}
            </form>
          ) : null}
        </Box>
      )}
    </Grid>
  );
};
