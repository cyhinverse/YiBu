import { Outlet } from 'react-router-dom';

const ProfileLayout = () => {
  return (
    <div className="min-h-[100dvh] bg-neutral-50 dark:bg-black">
      <Outlet />
    </div>
  );
};

export default ProfileLayout;
