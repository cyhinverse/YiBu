import { Outlet, Route, Routes } from "react-router-dom";
import UserLayout from "./pages/UserPage/UserLayout";
import Home from "./pages/UserPage/Home";
import Message from "./pages/UserPage/Message";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="messages" element={<Message />} />
          <Route path="videos" element={<div>Videos</div>} />
        </Route>
      </Routes>
      <Outlet />
    </>
  );
}

export default App;
