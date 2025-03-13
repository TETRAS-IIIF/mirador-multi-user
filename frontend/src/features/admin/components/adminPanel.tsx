import { Grid } from "@mui/material";
import CollapsibleTable from "../../../components/elements/CollapsibleTable.tsx";
import { getAllUsers } from "../api/getAllUsers.ts";
import { User } from "../../auth/types/types.ts";
import { useEffect, useMemo, useState } from "react";
import { initiateImpersonation } from "../api/initiateImpersonation.ts";
import { useTranslation } from "react-i18next";
import { RowProps } from "../../projects/types/types.ts";

export const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const { t } = useTranslation();

  const fetchUsers = async () => {
    const users = await getAllUsers();
    setUsers(users);
  };

  const columns = [
    { label: "ID", align: "left" as const, sortKey: "id" },
    { label: t("mail"), align: "left" as const, sortKey: "mail" },
    { label: t("name"), align: "left" as const, sortKey: "name" },
    { label: t("admin"), align: "center" as const, sortKey: "_isAdmin" },
    {
      label: t("emailConfirmed"),
      align: "center" as const,
      sortKey: "isEmailConfirmed",
    },
    { label: t("createdAt"), align: "left" as const, sortKey: "createdAt" },
  ];
  useEffect(() => {
    fetchUsers();
  });

  const rows = useMemo(() => {
    return users.map((user) => ({
      id: user.id,
      data: [
        { value: String(user.id), align: "left" as const },
        { value: user.mail, align: "left" as const },
        { value: user.name, align: "left" as const },
        { value: user._isAdmin ? "Yes" : "No", align: "center" as const },
        {
          value: user.isEmailConfirmed ? "Yes" : "No",
          align: "center" as const,
        },
        {
          value: new Date(user.createdAt).toLocaleString(),
          align: "left" as const,
        },
      ],
    }));
  }, [users]);

  async function handleActionClick(row: RowProps) {
    await initiateImpersonation(row.id);
  }

  return (
    <Grid sx={{ padding: 2 }}>
      <CollapsibleTable
        columns={columns}
        rows={rows}
        onActionClick={handleActionClick}
        labelButton={t("impersonate")}
      />
    </Grid>
  );
};
