import { Box, List } from '@mui/material';
import { ListRow } from './ListRow.tsx';

interface FixedSizeListProps {
  contents: string[];
  action: (projectName: string) => void;
}

export const FixedSizeList = ({ contents, action }: FixedSizeListProps) => {
  return (
    <Box
      sx={{
        width: '100%',
        maxHeight: 400,
        maxWidth: 360,
        bgcolor: 'background.paper',
      }}
    >
      <List>
        {contents.map((content) => (
          <ListRow
            key={content}
            content={content}
            index={content}
            action={action}
          />
        ))}
      </List>
    </Box>
  );
};
