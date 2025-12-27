import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    // Nếu chưa xác định tình trạng xác thực, đợi
    if (isAuthenticated === undefined) return;

    // Nếu chưa đăng nhập, chuyển về đăng nhập
    if (!isAuthenticated || !user) {
      navigate("/auth/login", { replace: true });
      return;
    }

    // Kiểm tra quyền admin
    const isUserAdmin = user.isAdmin || user.role === "admin";

    if (!isUserAdmin) {
      navigate("/access-denied", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return <Outlet />;
};

export default AdminRoute;
