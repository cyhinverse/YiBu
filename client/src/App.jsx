import { Outlet, Route, Routes } from 'react-router-dom';
import { Suspense, lazy, useMemo, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { useSettings } from './hooks/useUserQuery';
import { SocketProvider } from './contexts/SocketContext';
import { ROUTES } from './constants/routes';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ProtectedRoute from './pages/AuthPage/ProtectedRoute';
import AdminRoute from './pages/AuthPage/AdminRoute';
import { resetAuthState } from './redux/slices/AuthSlice';

// Lazy Load Pages & Components
const UserLayout = lazy(() => import('./pages/UserPage/UserLayout'));
const Home = lazy(() => import('./pages/UserPage/Home'));
const Message = lazy(() => import('./pages/UserPage/Message'));
const Explore = lazy(() => import('./pages/UserPage/Explore'));
const HashtagPosts = lazy(() => import('./pages/UserPage/HashtagPosts'));
const Notifications = lazy(() => import('./pages/UserPage/Notifications'));
const FollowingUser = lazy(() =>
  import('./components/features/user/Profiles/FollowingUser')
);
const Friends = lazy(() =>
  import('./components/features/user/Profiles/Friends')
);
const HomeProfile = lazy(() =>
  import('./components/features/user/Profiles/HomeProfile')
);
const ProfileLayout = lazy(() =>
  import('./components/features/user/Profiles/ProfileLayout')
);
const SavePosts = lazy(() =>
  import('./components/features/user/Profiles/SavePosts')
);
const MainMessage = lazy(() =>
  import('./components/features/chat/MainMessage')
);
const MessageDetail = lazy(() =>
  import('./components/features/chat/MessageDetail')
);
const Login = lazy(() => import('./pages/AuthPage/Login'));
const Register = lazy(() => import('./pages/AuthPage/Register'));
const AccountSettings = lazy(() =>
  import('./components/features/settings/AccountSettings')
);
const NotificationSettings = lazy(() =>
  import('./components/features/settings/NotificationSettings')
);
const PrivacySettings = lazy(() =>
  import('./components/features/settings/PrivacySettings')
);
const ProfileSettings = lazy(() =>
  import('./components/features/settings/ProfileSettings')
);
const SettingsLayout = lazy(() =>
  import('./components/features/settings/SettingsLayout')
);
const SecuritySettings = lazy(() =>
  import('./components/features/settings/SecuritySettings')
);
const BlockedMutedSettings = lazy(() =>
  import('./components/features/settings/BlockedMutedSettings')
);
const FollowRequestsSettings = lazy(() =>
  import('./components/features/settings/FollowRequestsSettings')
);
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));
const ForgotPassword = lazy(() => import('./pages/AuthPage/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/AuthPage/ResetPassword'));
const EnterCode = lazy(() => import('./pages/AuthPage/EnterCode'));
const AuthLayout = lazy(() => import('./pages/AuthPage/AuthLayout'));
const AdminPage = lazy(() => import('./pages/AdminPage/AdminPage'));
const AccessDenied = lazy(() => import('./pages/ErrorPages/AccessDenied'));

const App = () => {
  const dispatch = useDispatch();
  const authUser = useSelector(state => state.auth?.user);
  const { data: settingsData } = useSettings({ enabled: !!authUser });

  // Listen for auth logout events from axios interceptor
  useEffect(() => {
    const handleAuthLogout = () => {
      dispatch(resetAuthState());
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    return () => window.removeEventListener('auth-logout', handleAuthLogout);
  }, [dispatch]);

  return (
    <>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
            <LoadingSpinner />
          </div>
        }
      >
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route
              path={`${ROUTES.HOME}`}
              element={
                <SocketProvider>
                  <UserLayout />
                </SocketProvider>
              }
            >
              <Route index element={<Home />} />

              {/* Explore & Notifications */}
              <Route path="explore" element={<Explore />} />
              <Route path="explore/tag/:hashtag" element={<HashtagPosts />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="saved" element={<SavePosts />} />

              {/* Message Routes */}
              <Route path={`${ROUTES.MESSAGE}`} element={<Message />}>
                <Route index element={<MainMessage />} />
                <Route path=":conversationId" element={<MessageDetail />} />
              </Route>

              {/* Router settings */}
              <Route path={`${ROUTES.SETTINGS}`} element={<SettingsLayout />}>
                <Route index element={<AccountSettings />} />
                <Route path="account" element={<AccountSettings />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="privacy" element={<PrivacySettings />} />
                <Route path="security" element={<SecuritySettings />} />
                <Route path="notification" element={<NotificationSettings />} />
                <Route path="blocked" element={<BlockedMutedSettings />} />
                <Route
                  path="follow-requests"
                  element={<FollowRequestsSettings />}
                />
                <Route index element={<AccountSettings />} />
              </Route>

              <Route path={`${ROUTES.PROFILE}`} element={<ProfileLayout />}>
                <Route index element={<HomeProfile />} />
                <Route path=":userId" element={<HomeProfile />} />
                <Route path="home" element={<HomeProfile />} />
                <Route path="following" element={<FollowingUser />} />
                <Route path="friends" element={<Friends />} />
              </Route>
            </Route>
          </Route>

          {/* Admin Routes - Protected by AdminRoute */}
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>

          <Route path={`${ROUTES.AUTH}`} element={<AuthLayout />}>
            <Route index element={<Login />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="verify-code" element={<EnterCode />} />
          </Route>

          <Route path="access-denied" element={<AccessDenied />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Outlet />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
          },
          success: {
            style: {
              background: '#ECFDF5',
              border: '1px solid #10B981',
              color: '#065F46',
            },
          },
          error: {
            style: {
              background: '#FEF2F2',
              border: '1px solid #EF4444',
              color: '#991B1B',
            },
          },
        }}
      />
    </>
  );
};

export default App;
