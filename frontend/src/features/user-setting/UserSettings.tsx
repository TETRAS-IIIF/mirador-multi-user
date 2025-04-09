import { Button, Grid, TextField, Typography } from "@mui/material";
import storage from "../../utils/storage.ts";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { ModalButton } from "../../components/elements/ModalButton.tsx";
import toast from "react-hot-toast";
import { User } from "../auth/types/types.ts";
import { ProfileUpdateForm } from "./ProfileUpdateFom.tsx";
import { deleteAccount } from "../auth/api/deleteAccount.ts";
import { useState } from "react";
import { ModalConfirmDelete } from "../projects/components/ModalConfirmDelete.tsx";
import { MMUModal } from "../../components/elements/modal.tsx";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../translation/LanguageSelector.tsx";

interface IUserSettingsProps {
  user: User;
}

export const UserSettings = ({ user }: IUserSettingsProps) => {
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const { t } = useTranslation();

  const token = storage.getToken();

  const HandleCopyToClipBoard = async () => {
    await navigator.clipboard.writeText(token);
    toast.success(t("tokenCopiedToast"));
  };

  const handleDeleteAccount = async () => {
    const responseDelete = await deleteAccount(user.id);
    if (responseDelete) {
      window.location.reload();
    }
  };

  const handleConfirmDeleteItemModal = () => {
    setOpenDeleteModal(!openDeleteModal);
  };

  return (
    <Grid container spacing={2} sx={{ padding: 2 }}>
      <Grid
        container
        item
        flexDirection="row"
        alignItems="center"
        spacing={2}
        sx={{ width: "100%" }}
      >
        <Grid item xs={10}>
          <TextField
            label={t("labelApiToken")}
            disabled
            fullWidth
            helperText={t("helperTextApiToken")}
            defaultValue={token}
            inputProps={{
              maxLength: 255,
            }}
          />
        </Grid>
        <Grid item xs={2}>
          <ModalButton
            tooltipButton={t("tooltipButtonToken")}
            onClickFunction={HandleCopyToClipBoard}
            disabled={false}
            icon={<ContentCopyIcon />}
          />
        </Grid>
      </Grid>
      <Grid container item flexDirection="column" spacing={1}>
        <Grid item>
          <Typography variant="h5">{t("changeLanguage")}</Typography>
        </Grid>
        <Grid item>
          <LanguageSelector userId={user.id} />
        </Grid>
      </Grid>

      <Grid container item xs={12}>
        <ProfileUpdateForm  />
      </Grid>
      <Grid item spacing={2} sx={{ width: "100%" }}>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirmDeleteItemModal}
        >
          {t("DeleteAccount")}
        </Button>
      </Grid>
      <MMUModal
        width={400}
        openModal={openDeleteModal}
        setOpenModal={handleConfirmDeleteItemModal}
      >
        <ModalConfirmDelete
          deleteItem={handleDeleteAccount}
          itemId={user.id}
          content={t("deleteConfirmation", {
            itemName: t("yourAccount"),
          })}
          buttonLabel={t("deleteDefinitely")}
        />
      </MMUModal>
    </Grid>
  );
};
