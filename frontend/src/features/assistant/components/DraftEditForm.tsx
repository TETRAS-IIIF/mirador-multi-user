import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  Stack,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { editableParts, hasRichFormatting } from '../draftEdit.ts';

/** Inline edit of a draft's text and tags, in its card in the assistant panel. */
export function DraftEditForm({
  content,
  busy,
  onCancel,
  onSave,
  onOpenEditor,
}: {
  content: Record<string, unknown>;
  busy: boolean;
  onCancel: () => void;
  onSave: (text: string, tags: string[], accept: boolean) => void;
  /** Opens the full annotation editor (to change the shape). */
  onOpenEditor: () => void;
}) {
  const { t } = useTranslation();
  const initial = editableParts(content);
  const [text, setText] = useState(initial.text);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [pendingTag, setPendingTag] = useState('');
  const formRef = useRef<HTMLDivElement | null>(null);
  // Bring the whole form, buttons included, into view in the panel.
  useEffect(() => {
    formRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, []);

  /** Tags typed but not yet confirmed with Enter are kept too. */
  const allTags = () =>
    pendingTag.trim() ? [...tags, pendingTag.trim()] : tags;

  return (
    <Stack spacing={1} data-testid="draft-edit" ref={formRef}>
      {hasRichFormatting(initial.html) && (
        <Alert severity="info" sx={{ py: 0 }}>
          {t('assistant.editFormatting')}
        </Alert>
      )}
      <TextField
        label={t('assistant.editText')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        multiline
        minRows={3}
        maxRows={12}
        size="small"
        autoFocus
      />
      <Autocomplete
        multiple
        freeSolo
        options={[] as string[]}
        value={tags}
        inputValue={pendingTag}
        onInputChange={(_e, value) => setPendingTag(value)}
        onChange={(_e, value) => setTags(value as string[])}
        renderValue={(value, getItemProps) =>
          value.map((option, index) => {
            const { key, ...itemProps } = getItemProps({ index });
            return (
              <Chip key={key} size="small" label={option} {...itemProps} />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            label={t('assistant.editTags')}
            helperText={t('assistant.editTagsHelp')}
          />
        )}
      />
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        flexWrap="wrap"
        useFlexGap
      >
        <Button size="small" onClick={onOpenEditor} disabled={busy}>
          {t('assistant.openEditor')}
        </Button>
        <Button size="small" onClick={onCancel} disabled={busy}>
          {t('assistant.no')}
        </Button>
        <Button
          size="small"
          variant="outlined"
          disabled={busy || !text.trim()}
          onClick={() => onSave(text, allTags(), false)}
        >
          {t('assistant.save')}
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={busy || !text.trim()}
          onClick={() => onSave(text, allTags(), true)}
        >
          {t('assistant.saveAndAccept')}
        </Button>
      </Stack>
    </Stack>
  );
}
