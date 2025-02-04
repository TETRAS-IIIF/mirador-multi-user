import { Button, Grid, Typography } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

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
    <Grid container wrap="nowrap" spacing={2}>
      <Grid item>
        <WarningAmberIcon sx={{ color: "red" }} fontSize="large" />
      </Grid>
      <Grid item container spacing={2}>
        <Grid item>
          <Typography dangerouslySetInnerHTML={{ __html: content }} />
        </Grid>
        <Grid item>
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
