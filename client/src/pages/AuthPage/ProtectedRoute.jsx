import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated === undefined) return;
    if (!isAuthenticated || !user) {
      navigate("/auth/login", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return <Outlet />;
};

export default ProtectedRoute;
