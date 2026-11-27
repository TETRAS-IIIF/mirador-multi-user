import { useState } from 'react';
import {
  Button,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { useTranslation } from 'react-i18next';
import { giveFeedback, type Rating } from '../api.ts';

/** Thumbs up / down under an answer; a down vote can take a comment. */
export function AnswerFeedback({ runId }: { runId: string }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState<Rating | null>(null);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);

  const send = async (value: Rating, text?: string) => {
    setRating(value);
    setFailed(false);
    try {
      await giveFeedback(runId, value, text);
      setSent(true);
    } catch (error) {
      console.error(error);
      setFailed(true);
    }
  };

  return (
    <Stack spacing={0.5} data-testid="answer-feedback">
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Tooltip title={t('assistantFeedback.up')}>
          <IconButton
            size="small"
            aria-label={t('assistantFeedback.up')}
            aria-pressed={rating === 'up'}
            onClick={() => {
              setCommenting(false);
              send('up');
            }}
          >
            {rating === 'up' ? (
              <ThumbUpIcon fontSize="inherit" color="primary" />
            ) : (
              <ThumbUpOutlinedIcon fontSize="inherit" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('assistantFeedback.down')}>
          <IconButton
            size="small"
            aria-label={t('assistantFeedback.down')}
            aria-pressed={rating === 'down'}
            onClick={() => {
              setCommenting(true);
              send('down');
            }}
          >
            {rating === 'down' ? (
              <ThumbDownIcon fontSize="inherit" color="error" />
            ) : (
              <ThumbDownOutlinedIcon fontSize="inherit" />
            )}
          </IconButton>
        </Tooltip>
        {sent && !commenting && (
          <Typography variant="caption" color="text.secondary">
            {t('assistantFeedback.thanks')}
          </Typography>
        )}
        {failed && (
          <Typography variant="caption" color="error">
            {t('assistant.actionFailed')}
          </Typography>
        )}
      </Stack>
      {commenting && (
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <TextField
            size="small"
            fullWidth
            multiline
            maxRows={4}
            placeholder={t('assistantFeedback.commentPlaceholder')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            slotProps={{
              htmlInput: {
                maxLength: 2000,
                'aria-label': t('assistantFeedback.comment'),
              },
            }}
          />
          <Button
            size="small"
            disabled={!comment.trim()}
            onClick={async () => {
              await send('down', comment.trim());
              setCommenting(false);
            }}
          >
            {t('assistantFeedback.send')}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
