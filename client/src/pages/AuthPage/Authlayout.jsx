import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const AuthLayout = () => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const isRehydrated = useSelector(state => state._persist?.rehydrated);

  if (!isRehydrated) {
    return null;
  }

  if (isAuthenticated && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <main id="main-content">
      <Outlet />
    </main>
  );
};

export default AuthLayout;
