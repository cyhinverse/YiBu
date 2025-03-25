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
  NotificationSettings,
  PrivacySettings,
  ProfileSettings,
  SettingsLayout,
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
import AdminRoute from "./pages/AuthPage/AdminRoute";
import AdminPage from "./pages/AdminPage/AdminPage";
import AccessDenied from "./pages/ErrorPages/AccessDenied";
import { SocketProvider } from "./contexts/SocketContext";
import { getLikeManager } from "./socket/likeManager";
import { getNotificationManager } from "./socket/notificationManager";
import { useSelector } from "react-redux";
import { OnlineUsersProvider } from "./contexts/OnlineUsersContext";

const App = () => {
  const currentUser = useSelector((state) => state.auth?.user);
  const userSettings = useSelector((state) => state.user?.settings);
  const theme = userSettings?.theme;

  // Create the ref outside the effect
  const prevThemeRef = React.useRef({
    appearance: null,
    primaryColor: null,
    fontSize: null,
  });

  useEffect(() => {
    const likeManager = getLikeManager();
    if (!likeManager) {
      console.warn("[App] Failed to initialize likeManager");
    } else {
      console.log("[App] likeManager initialized successfully");
    }

    const notificationManager = getNotificationManager();
    if (!notificationManager) {
      console.warn("[App] Failed to initialize notificationManager");
    } else {
      console.log("[App] notificationManager initialized successfully");
    }
  }, []);

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

  // Apply theme settings from Redux
  useEffect(() => {
    console.log("App: Applying theme settings from Redux", theme);

    if (!theme) {
      console.log("App: No theme settings found, using defaults");
      return;
    }

    const prevTheme = prevThemeRef.current;

    // Only update appearance if it changed
    if (prevTheme.appearance !== theme.appearance) {
      // Apply appearance
      if (theme.appearance === "light") {
        console.log("App: Setting light mode");
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        console.log(
          "App: Current classList after light mode:",
          document.documentElement.className
        );
      } else if (theme.appearance === "dark") {
        console.log("App: Setting dark mode");
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
        console.log(
          "App: Current classList after dark mode:",
          document.documentElement.className
        );
      } else if (theme.appearance === "system") {
        console.log("App: Setting system mode");
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        console.log("App: System prefers dark mode?", prefersDark);
        document.documentElement.classList.remove(
          prefersDark ? "light" : "dark"
        );
        document.documentElement.classList.add(prefersDark ? "dark" : "light");
        console.log(
          "App: Current classList after system mode:",
          document.documentElement.className
        );
      }
      prevTheme.appearance = theme.appearance;
    }

    // Only update primary color if it changed
    if (prevTheme.primaryColor !== theme.primaryColor) {
      console.log("App: Setting primary color to", theme.primaryColor);
      document.documentElement.style.setProperty(
        "--primary-color",
        theme.primaryColor
      );
      prevTheme.primaryColor = theme.primaryColor;
    }

    // Only update font size if it changed
    if (prevTheme.fontSize !== theme.fontSize) {
      let rootFontSize = "16px";
      if (theme.fontSize === "small") rootFontSize = "14px";
      if (theme.fontSize === "large") rootFontSize = "18px";
      console.log("App: Setting font size to", rootFontSize);
      document.documentElement.style.fontSize = rootFontSize;
      prevTheme.fontSize = theme.fontSize;
    }
  }, [theme]);

  return (
    <>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route
            path={`${ROUTES.HOME}`}
            element={
              <SocketProvider>
                <OnlineUsersProvider>
                  <UserLayout />
                </OnlineUsersProvider>
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
