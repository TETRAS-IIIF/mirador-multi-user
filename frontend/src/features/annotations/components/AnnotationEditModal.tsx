import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import Editor from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Annotation } from '../hooks/useAnnotationFilters.ts';

interface AnnotationEditModalProps {
  open: boolean;
  annotation: Annotation | null;
  onClose: () => void;
  onSave: (id: string, updated: Annotation) => void;
  annotationId: string | null;
}

export const AnnotationEditModal = ({
  open,
  annotation,
  annotationId,
  onClose,
  onSave,
}: AnnotationEditModalProps) => {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (annotation) {
      setValue(JSON.stringify(annotation, null, 2));
      setError(null);
    }
  }, [annotation]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(value);
      setError(null);
      if (annotationId) onSave(annotationId, parsed);
      onClose();
    } catch (e) {
      setError(t('annotations.invalidJson', { message: (e as Error).message }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('annotations.editAnnotation')}</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ height: 500, border: '1px solid #ddd', borderRadius: 1 }}>
          <Editor
            height="100%"
            defaultLanguage="json"
            value={value}
            onChange={(v) => setValue(v ?? '')}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              tabSize: 2,
              formatOnPaste: true,
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('annotations.cancel')}</Button>
        <Button onClick={handleSave} variant="contained">
          {t('annotations.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
