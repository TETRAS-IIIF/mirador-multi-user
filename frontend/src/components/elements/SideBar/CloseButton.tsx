import { Grid, Typography, useTheme } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface CloseButtonProps {
  text: string;
  isSelected?: boolean;
}

export const CloseButton = ({ text, isSelected }: CloseButtonProps) => {
  const theme = useTheme();

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundColor: isSelected
          ? theme.palette.selectedBackground
          : theme.palette.background.paper,
        padding: "5px",
        borderRadius: 1,
        transformOrigin: "0 0",
        transform: "rotate(-90deg)",
        boxShadow: theme.shadows[4],
      }}
    >
      <Typography
        variant="body2"
        color={
          isSelected ? theme.palette.selectedText : theme.palette.primary.main
        }
      >
        {text}
      </Typography>
      <ExpandMoreIcon />
    </Grid>
  );
};
