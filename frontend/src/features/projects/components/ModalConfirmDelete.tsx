import { Button, Grid, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface IModalConfirmDeleteProps {
  deleteItem?: (itemId: number, share?: string) => void;
  itemId: number;
  share?: string;
  content: string;
  buttonLabel: string;
}

export const ModalConfirmDelete = ({
  deleteItem,
  itemId,
  share,
  content,
  buttonLabel,
}: IModalConfirmDeleteProps) => {
  return (
    <Grid
      container
      direction="row"
      sx={{
        justifyContent: 'center',
      }}
    >
      <Grid>
        <WarningAmberIcon sx={{ color: 'red' }} fontSize="large" />
      </Grid>
      <Grid container spacing={2}>
        <Grid>
          <Typography
            sx={{ 'word-break': ' break-word' }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </Grid>
        <Grid
          container
          size={12}
          direction="row"
          sx={{ justifyContent: 'center' }}
        >
          {deleteItem && (
            <Button
              color="error"
              variant="contained"
              onClick={
                share
                  ? () => deleteItem(itemId, share)
                  : () => deleteItem(itemId)
              }
            >
              {buttonLabel}
            </Button>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};
