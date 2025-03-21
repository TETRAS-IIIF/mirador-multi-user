import { Box, Button, ImageListItemBar, styled } from "@mui/material";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import ImageIcon from "@mui/icons-material/Image";
import { Media, MediaTypes } from "../types/types";
import placeholder from "../../../assets/Placeholder.svg";
import videoPlaceHolder from "../../../assets/video_placeholder.webp";
import otherPlaceHolder from "../../../assets/other_placeholder.webp";

const CustomImageItem = styled("div")({
  position: "relative",
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
  const thumbnailUrl = (): string | undefined => {
    if (media.mediaTypes === MediaTypes.IMAGE) {
      return media.hash
        ? `${caddyUrl}/${media.hash}/thumbnail.webp`
        : placeholder;
    }
    if (media.mediaTypes === MediaTypes.VIDEO) {
      return media.hash
        ? `${caddyUrl}/${media.hash}/thumbnail.webp`
        : videoPlaceHolder;
    }
    if (media.mediaTypes === MediaTypes.OTHER) {
      return otherPlaceHolder;
    }
    return undefined;
  };
  return (
    <CustomImageItem key={media.id}>
      <Box
        component="img"
        src={thumbnailUrl()}
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
