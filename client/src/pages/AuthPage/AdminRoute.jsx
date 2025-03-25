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
    console.log("AdminRoute - Checking admin status:", {
      user,
      isAdmin: user.isAdmin,
      role: user.role,
      isUserAdmin,
    });

    if (!isUserAdmin) {
      console.log("User is not admin, redirecting to access-denied");
      navigate("/access-denied", { replace: true });
    } else {
      console.log("User is admin, allowing access to admin routes");
    }
  }, [isAuthenticated, user, navigate]);

  return <Outlet />;
};

export default AdminRoute;
