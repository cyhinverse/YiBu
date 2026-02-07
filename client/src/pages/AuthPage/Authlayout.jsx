import React from "react";
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <main id="main-content">
      <Outlet />
    </main>
  );
};

export default AuthLayout;
