import { Route, Routes } from "react-router-dom";
// import { Register } from "./Register.tsx";
import { Login } from "./Login.tsx";

export const AuthRoutes = () => {
  return (
    <Routes>
      <Route path="/login" Component={Login} />
      {/*//TODO: This is commented for Houston first Implementation, this should be uncomented for allowing user to create account*/}
      {/*<Route path="/signin" Component={Register} />*/}
    </Routes>
  );
};
