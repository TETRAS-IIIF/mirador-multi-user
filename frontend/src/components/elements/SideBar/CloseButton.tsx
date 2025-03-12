import { Grid, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface CloseButtonProps {
  text: string;
  isSelected?: boolean;
}

export const CloseButton = ({ text, isSelected }: CloseButtonProps) => {
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundColor: isSelected ? "#1976d2" : "#fff",
        padding: "5px",
        borderRadius: 1,
        transformOrigin: "0 0",
        transform: "rotate(-90deg)",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.8)",
      }}
    >
      <Typography
        variant="body2"
        color={isSelected ? "#F5EBFF" : "#1976d2"}
        sx={{
          textColor: isSelected ? "white" : "inherit",
        }}
      >
        {text}
      </Typography>
      <ExpandMoreIcon />
    </Grid>
  );
};
