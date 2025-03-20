import { useState } from "react";
import { Box, Button, Grid, TextField } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { MMUModal } from "../../../components/elements/modal.tsx";
import { useTranslation } from "react-i18next";
import CodeIcon from "@mui/icons-material/Code";
import toast from "react-hot-toast";

interface IframeGeneratorProps {
  snapshotUrl: string | null;
}

export const IFrameGenerator = ({ snapshotUrl }: IframeGeneratorProps) => {
  const [openIframeModal, setOpenIframeModal] = useState(false);
  const { t } = useTranslation();

  const iframeCode = `<iframe src="${snapshotUrl}" width="100%" height="600px" style="border:none;" title="Project Snapshot"></iframe>`;

  const handleCopyToClipboard = async () => {
    if (iframeCode) {
      await navigator.clipboard.writeText(iframeCode);
      toast.success(t("iframe_copied"));
    }
  };

  const handleIframeModal = () => {
    setOpenIframeModal(!openIframeModal);
  };
  return (
    snapshotUrl && (
      <Box>
        <Button
          variant="contained"
          startIcon={<CodeIcon />}
          onClick={handleIframeModal}
        >
          {t("generate_iframe")}
        </Button>
        <MMUModal
          openModal={openIframeModal}
          setOpenModal={handleIframeModal}
          width={500}
        >
          <Grid container spacing={2} flexDirection={"column"}>
            <Grid item>
              <TextField
                inputProps={{
                  maxLength: 255,
                }}
                label="Iframe Code"
                multiline
                fullWidth
                value={iframeCode}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyToClipboard}
              >
                {t("Copy_iframe_code")}
              </Button>
            </Grid>
          </Grid>
        </MMUModal>
      </Box>
    )
  );
};
