import { Outlet, Route, Routes } from "react-router-dom";
import UserLayout from "./pages/UserPage/UserLayout";
import Home from "./pages/UserPage/Home";
import Message from "./pages/UserPage/Message";
import { MainVideos } from "./components/UserComponents";
import Profile from "./pages/UserPage/Profile";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="messages" element={<Message />} />
          <Route path="videos" element={<MainVideos />}>
            <Route
              index
              // path="videos/recommended"
              element={<div className="flex-1">recommended</div>}
            />
            <Route
              index
              path="recommended"
              element={<div className="flex-1">recommended</div>}
            />
            <Route path="random" element={<h1>Random</h1>} />
            <Route path="following" element={<h1>Following</h1>} />
            <Route path="friends" element={<h1>Friends</h1>} />
            <Route path="games" element={<h1>Games</h1>} />
            <Route path="live" element={<h1>Live</h1>} />
            <Route path="travel" element={<h1>Travel</h1>} />
          </Route>

          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
      <Outlet />
    </>
  );
}

export default App;
