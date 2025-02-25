import { Box, Button, ImageListItemBar, styled } from "@mui/material";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import ImageIcon from "@mui/icons-material/Image";
import { Media, MediaTypes } from "../types/types";

const CustomImageItem = styled("div")({
  position: "relative",
  width: 150,
  height: 150,
  "&:hover img": {
    opacity: 0.4,
  },
  "&:hover .overlayButton": {
    opacity: 1,
  },
});

const CustomButton = styled(Button)({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  textAlign: "center",
  opacity: 0,
  transition: "opacity 0.3s ease",
});

interface ImageBoxProps {
  media: Media;
  caddyUrl: string;
  handleCopyToClipBoard: (path: string) => void;
}

export const ImageBox = ({
  media,
  caddyUrl,
  handleCopyToClipBoard,
}: ImageBoxProps) => {
  return (
    <CustomImageItem key={media.id}>
      <Box
        component="img"
        src={`${caddyUrl}/${media.hash}/thumbnail.webp`}
        alt={media.title}
        loading="lazy"
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          "@media(min-resolution: 2dppx)": {
            width: "100%",
            height: "100%",
          },
        }}
      />
      <ImageListItemBar
        title={media.title}
        sx={{
          position: "absolute",
          bottom: 0,
          color: "white",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          color: "white",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {media.mediaTypes === MediaTypes.VIDEO ? (
          <OndemandVideoIcon />
        ) : (
          <ImageIcon />
        )}
      </Box>
      <CustomButton
        className="overlayButton"
        disableRipple
        onClick={() =>
          handleCopyToClipBoard(
            media.path
              ? `${caddyUrl}/${media.hash}/${media.path}`
              : `${media.url}`,
          )
        }
      >
        Copy path to clipboard
      </CustomButton>
    </CustomImageItem>
  );
};
