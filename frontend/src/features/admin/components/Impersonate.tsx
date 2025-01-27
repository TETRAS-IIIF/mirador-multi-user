import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import storage from "../../../utils/storage.ts";
import { useLogin, useLogout } from "../../../utils/auth.tsx";
import { useTranslation } from "react-i18next";

export const Impersonate = () => {
  const navigate = useNavigate();
  const logout = useLogout({});
  const { mutateAsync: loginUser } = useLogin();
  const { t } = useTranslation();

  useEffect(() => {
    const impersonate = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (token) {
        try {
          const userData = storage.GetImpersonateUserData();
          if (userData) {
            await logout.mutateAsync({});

            // Call `mutateAsync` and handle navigation after it resolves
            await loginUser({ mail: "", password: "", isImpersonate: token });
            navigate("/app/my-projects");
          }
        } catch (error) {
          console.error("Failed to impersonate user:", error);
        }
      }
    };

    impersonate();
  }, []);

  return (
    <>
      <div>{t("loadingImpersonate")}</div>
    </>
  );
};
