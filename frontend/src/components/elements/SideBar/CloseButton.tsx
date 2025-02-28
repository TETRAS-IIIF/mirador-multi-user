import { Grid, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface CloseButtonProps {
  text: string;
}

export const CloseButton = ({ text }: CloseButtonProps) => {
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundColor: "#fff",
        padding: "5px",
        borderRadius: 1,
        transformOrigin: "0 0",
        transform: "rotate(-90deg)",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.8)",
      }}
    >
      <Typography variant="body2" color="textSecondary">
        {text}
      </Typography>
      <ExpandMoreIcon />
    </Grid>
  );
};
