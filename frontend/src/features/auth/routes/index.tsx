import { Route, Routes } from "react-router-dom";
import { Login } from "./Login.tsx";
import { Register } from "./Register.tsx";

export const AuthRoutes = () => {
  return (
    <Routes>
      <Route path="/login" Component={Login} />
      <Route path="/signin" Component={Register} />
    </Routes>
  );
};
