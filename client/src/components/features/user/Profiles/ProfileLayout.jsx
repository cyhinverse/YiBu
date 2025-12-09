import { Outlet } from "react-router-dom";

const ProfileLayout = () => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black">
      <Outlet />
    </div>
  );
};

export default ProfileLayout;
