import { Button, Grid, Typography } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useTranslation } from "react-i18next";

interface IModalConfirmDeleteProps {
  itemName: string;
  deleteItem?: (itemId: number, share?: string) => void;
  itemId: number;
  share?: string;
}

export const ModalConfirmDelete = ({
  itemName,
  deleteItem,
  itemId,
  share,
}: IModalConfirmDeleteProps) => {
  const { t } = useTranslation();

  return (
    <Grid container wrap="nowrap" spacing={2}>
      <Grid item>
        <WarningAmberIcon sx={{ color: "red" }} fontSize="large" />
      </Grid>
      <Grid item container spacing={2}>
        <Grid item>
          <Typography
            dangerouslySetInnerHTML={{
              __html: t("deleteConfirmation", { itemName }),
            }}
          />
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
              {t("deleteDefinitely")}
            </Button>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};
