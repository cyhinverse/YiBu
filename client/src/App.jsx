import { Outlet, Route, Routes } from "react-router-dom";
import UserLayout from "./pages/UserPage/UserLayout";
import Home from "./pages/UserPage/Home";
import Message from "./pages/UserPage/Message";
import Explore from "./pages/UserPage/Explore";
import Notifications from "./pages/UserPage/Notifications";
import {
  FollowingUser,
  Friends,
  HomeProfile,
  ProfileLayout,
  SavePosts,
} from "./components/features/user/Profiles";
import MainMessage from "./components/features/chat/MainMessage";
import MessageDetail from "./components/features/chat/MessageDetail";
import Login from "./pages/AuthPage/Login";
import Register from "./pages/AuthPage/Register";
import {
  AccountSettings,
  NotificationSettings,
  PrivacySettings,
  ProfileSettings,
  SettingsLayout,
  ThemeSettings,
} from "./components/features/settings/Settings";
import { ROUTES } from "./constants/routes";
import NotFound from "./pages/NotFound/NotFound";
import ForgotPassword from "./pages/AuthPage/ForgotPassword";
import EnterCode from "./pages/AuthPage/EnterCode";
import AuthLayout from "./pages/AuthPage/AuthLayout";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./pages/AuthPage/ProtectedRoute";
import AdminRoute from "./pages/AuthPage/AdminRoute";
import AdminPage from "./pages/AdminPage/AdminPage";
import AccessDenied from "./pages/ErrorPages/AccessDenied";
import { SocketProvider } from "./contexts/SocketContext";
import { useSelector } from "react-redux";
import { useTheme } from "./hooks/useTheme";
import React from "react";

const App = () => {
  const userSettings = useSelector((state) => state.user?.settings);
  // Apply theme settings
  useTheme(userSettings?.theme);

  return (
    <>
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
            <Route path="notifications" element={<Notifications />} />

            {/* Message Routes */}
            <Route path={`${ROUTES.MESSAGE}`} element={<Message />}>
              <Route index element={<MainMessage />} />
              <Route path=":userId" element={<MessageDetail />} />
            </Route>

            {/* Router settings */}
            <Route path={`${ROUTES.SETTINGS}`} element={<SettingsLayout />}>
              <Route index element={<AccountSettings />} />
              <Route path="account" element={<AccountSettings />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="privacy" element={<PrivacySettings />} />
              <Route path="notification" element={<NotificationSettings />} />

              <Route path="theme" element={<ThemeSettings />} />
            </Route>

            <Route path={`${ROUTES.PROFILE}`} element={<ProfileLayout />}>
              <Route index element={<HomeProfile />} />
              <Route path=":userId" element={<HomeProfile />} />
              <Route path="home" element={<HomeProfile />} />
              <Route path="following" element={<FollowingUser />} />
              <Route path="friends" element={<Friends />} />
              <Route path="save-posts" element={<SavePosts />} />
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
          <Route path="verify-code" element={<EnterCode />} />
        </Route>

        <Route path="access-denied" element={<AccessDenied />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Outlet />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#333",
          },
          success: {
            style: {
              background: "#ECFDF5",
              border: "1px solid #10B981",
              color: "#065F46",
            },
          },
          error: {
            style: {
              background: "#FEF2F2",
              border: "1px solid #EF4444",
              color: "#991B1B",
            },
          },
        }}
      />
    </>
  );
};

export default App;
