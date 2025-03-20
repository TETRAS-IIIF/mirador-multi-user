import { Grid, Typography } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

interface CloseButtonProps {
  text: string;
  isSelected?: boolean;
}

export const OpenButton = ({ text, isSelected }: CloseButtonProps) => {
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
        color="textSecondary"
        align="center"
        sx={{
          textColor: isSelected ? "white" : "inherit",
        }}
      >
        {text}
      </Typography>
      <ExpandLessIcon />
    </Grid>
  );
};
