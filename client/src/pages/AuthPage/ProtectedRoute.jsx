import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const isRehydrated = useSelector(state => state._persist?.rehydrated);

  // Wait for redux-persist to finish rehydrating before making any redirect decisions
  if (!isRehydrated) {
    return null; // or a loading spinner
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
