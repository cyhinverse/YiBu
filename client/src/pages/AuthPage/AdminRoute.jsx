import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const isRehydrated = useSelector(state => state._persist?.rehydrated);

  if (!isRehydrated) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const isUserAdmin = user.isAdmin || user.role === 'admin';

  if (!isUserAdmin) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
