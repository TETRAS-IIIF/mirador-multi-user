import { Grid, IconButton, styled, Tooltip, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface IReplaceModalContent {
  handleReplaceMedia: () => void;
}

export const ReplaceModalContent = ({
  handleReplaceMedia,
}: IReplaceModalContent) => {
  return (
    <Grid container direction={'column'} spacing={1}>
      <Typography>ATTENTION Ceci va remplacer le media</Typography>
      <VisuallyHiddenInput
        id="hiddenFileInput"
        type="file"
        onChange={handleReplaceMedia}
      />
      <Grid container justifyContent={'center'}>
        <Tooltip title={'Upload a media to replace this one'} color={'primary'}>
          <IconButton
            onClick={() => document.getElementById('hiddenFileInput')?.click()}
          >
            <UploadFileIcon color="primary" />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  );
};
