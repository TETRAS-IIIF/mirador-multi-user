import { TextEditor } from './TextEditor.tsx';
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SelectChangeEvent } from '@mui/material/Select';
import { Template } from '../../../features/projects/types/types.ts';
import { v4 as uuidv4 } from 'uuid';

interface NoteTemplateProps {
  templates: Template[];
  setTemplates: (templates: Template[]) => void;
}

export const NoteTemplate = ({
  templates,
  setTemplates,
}: NoteTemplateProps) => {
  const { t } = useTranslation();

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    templates[0] || null,
  );

  const handleCreateNewTemplate = () => {
    const newtemplate = {
      title: t('newTemplateTitle'),
      content: t('newTemplateContent'),
      id: uuidv4(),
    };

    setTemplates([...templates, newtemplate]);
    setSelectedTemplate(newtemplate);
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    const updatedTemplateList = templates.filter(
      (temp) => temp.title !== selectedTemplate.title,
    );

    setTemplates(updatedTemplateList);
    setSelectedTemplate(null);
  };

  const handleSelectTemplate = (event: SelectChangeEvent<string>) => {
    const selected =
      templates.find((temp) => temp.id === event.target.value) || null;
    setSelectedTemplate(selected);
  };

  const saveCurrentTemplate = () => {
    if (!selectedTemplate) return;

    const updatedTemplateList = templates.map((temp) =>
      temp.id !== selectedTemplate.id ? temp : selectedTemplate,
    );

    setTemplates(updatedTemplateList);
    setSelectedTemplate(null);
  };

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedTemplate({
      content: selectedTemplate?.content || '',
      id: selectedTemplate?.id || '',
      title: event.target.value,
    });
  };
  const handleTemplateContent = (newTextValue: string) => {
    if (selectedTemplate) {
      selectedTemplate.content = newTextValue;
    }
  };

  return (
    <Grid container spacing={2} flexDirection="column" sx={{ marginTop: 1 }}>
      <Grid container spacing={1} flexDirection="column">
        <Grid container flexDirection="row" alignItems="center" spacing={2}>
          <Grid sx={{ marginBottom: 2 }}>
            <Typography>{t('noteTemplateInfo')}</Typography>
          </Grid>
          <Grid>
            <FormControl sx={{ width: '400px' }}>
              <InputLabel id="template-select-label">
                {t('templateChoice')}
              </InputLabel>

              <Select
                labelId="template-select-label"
                value={selectedTemplate ? selectedTemplate.id : ''}
                label={t('templateChoice')}
                onChange={handleSelectTemplate}
              >
                {templates.map((temp) => (
                  <MenuItem key={temp.id} value={temp.id}>
                    {temp.title}
                  </MenuItem>
                ))}
                {!templates.length && (
                  <MenuItem disabled>{t('noTemplatesAvailable')}</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid>
            <Button
              color="primary"
              variant="contained"
              onClick={handleCreateNewTemplate}
            >
              {t('createNewTemplate')}
            </Button>
          </Grid>
        </Grid>

        {selectedTemplate && (
          <Grid
            container
            flexDirection="column"
            spacing={1}
            sx={{
              display: 'flex',
              height: '100%',
              marginTop: 1,
            }}
          >
            <Grid>
              <TextField
                fullWidth
                label={t('title')}
                value={selectedTemplate?.title || ''}
                onChange={handleTitleChange}
              />
            </Grid>
            <Grid>
              <TextEditor
                textHtml={selectedTemplate?.content || ''}
                updateText={handleTemplateContent}
              />
            </Grid>
            <Grid
              container
              sx={{
                mt: 'auto',
                display: 'flex',
                justifyContent: 'space-between',
                backGround: 'white',
              }}
            >
              <Grid>
                <Button
                  color="error"
                  variant="contained"
                  onClick={handleDeleteTemplate}
                  disabled={!selectedTemplate}
                >
                  {t('deleteTemplate')}
                </Button>
              </Grid>
              <Grid>
                <Button
                  color="primary"
                  variant="contained"
                  onClick={saveCurrentTemplate}
                >
                  {t('updateTemplate')}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};
