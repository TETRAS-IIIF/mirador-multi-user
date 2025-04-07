import {
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

interface IUnMutableSettingsProps {
  settings: [string, string][];
}

export const UnMutableSettingsViewer = ({ settings }: IUnMutableSettingsProps) => {
  return (
    <Grid item container>
      <TableContainer component={Paper} sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          System Settings
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Key</strong></TableCell>
              <TableCell><strong>Value</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {settings.map(([key, value]) => (
              <TableRow key={key}>
                <TableCell>{key}</TableCell>
                <TableCell>{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>

  );
};
