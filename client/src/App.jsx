import { Outlet, Route, Routes } from "react-router-dom";
import UserLayout from "./pages/UserPage/UserLayout";
import Home from "./pages/UserPage/Home";
import Message from "./pages/UserPage/Message";
import {
  FollowingUser,
  Friends,
  HomeProfile,
  ProfileLayout,
  SavePosts,
  MainMessage,
  MessageDetail,
} from "./components/UserComponents";
import Login from "./pages/AuthPage/Login";
import Register from "./pages/AuthPage/Register";
import {
  AccountSettings,
  ContentSettings,
  NotificationSettings,
  PrivacySettings,
  ProfileSettings,
  SecuritySettings,
  SettingsLayout,
  SupportSettings,
  ThemeSettings,
} from "./components/UserComponents/Settings";
import { ROUTES } from "./constants/routes";
import NotFound from "./pages/NotFound/NotFound";
import ForgotPassword from "./pages/AuthPage/ForgotPassword";
import EnterCode from "./pages/AuthPage/EnterCode";
import AuthLayout from "./pages/AuthPage/AuthLayout";
import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./pages/AuthPage/ProtectedRoute";
import AdminPage from "./pages/AdminPage/AdminPage";
import { SocketProvider } from "./contexts/SocketContext";
import { getLikeManager } from "./socket/likeManager";
import { getNotificationManager } from "./socket/notificationManager";
import { useSelector } from "react-redux";

const App = () => {
  const currentUser = useSelector((state) => state.auth?.user);

  useEffect(() => {
    // Khởi tạo likeManager
    const likeManager = getLikeManager();
    if (!likeManager) {
      console.warn("[App] Failed to initialize likeManager");
    } else {
      console.log("[App] likeManager initialized successfully");
    }

    // Khởi tạo notificationManager
    const notificationManager = getNotificationManager();
    if (!notificationManager) {
      console.warn("[App] Failed to initialize notificationManager");
    } else {
      console.log("[App] notificationManager initialized successfully");
    }
  }, []);

  // Đăng ký nhận thông báo khi người dùng đã đăng nhập
  useEffect(() => {
    if (currentUser?.user?._id) {
      const notificationManager = getNotificationManager();
      if (notificationManager) {
        notificationManager.registerForNotifications(currentUser.user._id);
        console.log(
          "[App] Registered for notifications with userId:",
          currentUser.user._id
        );
      }
    }
  }, [currentUser?.user?._id]);

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
              <Route path="security" element={<SecuritySettings />} />
              <Route path="content" element={<ContentSettings />} />
              <Route path="theme" element={<ThemeSettings />} />
              <Route path="support" element={<SupportSettings />} />
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

        <Route path={`${ROUTES.AUTH}`} element={<AuthLayout />}>
          <Route index element={<Login />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="verify-code" element={<EnterCode />} />
        </Route>
        <Route path="admin" element={<AdminPage />} />

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
