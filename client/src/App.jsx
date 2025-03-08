import { Outlet, Route, Routes } from "react-router-dom";
import UserLayout from "./pages/UserPage/UserLayout";
import Home from "./pages/UserPage/Home";
import Message from "./pages/UserPage/Message";
import {
  FollowingUser,
  Friends,
  HomeProfile,
  MainVideos,
  ProfileLayout,
  SavePosts,
} from "./components/UserComponents";
import RecommendVideo from "./components/UserComponents/Videos/RecommendVideo";
import Authlayout from "./pages/AuthPage/Authlayout";
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

function App() {
  return (
    <>
      <Routes>
        <Route path={`${ROUTES.HOME}`} element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="messages" element={<Message />} />

          {/* Router videos */}
          <Route path="videos" element={<MainVideos />}>
            <Route index element={<RecommendVideo />} />
            <Route path="recommended" element={<RecommendVideo />} />
            <Route path="random" element={<h1>Random</h1>} />
            <Route path="following" element={<h1>Following</h1>} />
            <Route path="friends" element={<h1>Friends</h1>} />
            <Route path="games" element={<h1>Games</h1>} />
            <Route path="live" element={<h1>Live</h1>} />
            <Route path="travel" element={<h1>Travel</h1>} />
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
            <Route path="home" element={<HomeProfile />} />
            <Route path="following" element={<FollowingUser />} />
            <Route path="friends" element={<Friends />} />
            <Route path="save-posts" element={<SavePosts />} />
          </Route>
        </Route>

        <Route path="auth" element={<Authlayout />}>
          <Route index element={<Login />} />
          <Route path={`${ROUTES.LOGIN}`} element={<Login />} />
          <Route path={`${ROUTES.REGISTER}`} element={<Register />} />
        </Route>

        <Route
          path="*"
          element={
            <h1 className="w-screen h-screen font-bold text-black text-center flex items-center justify-center text-xl">
              404 Not Found
            </h1>
          }
        />
      </Routes>
      <Outlet />
    </>
  );
}

export default App;
