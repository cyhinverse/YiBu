import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navigate from "../../components/layout/Navigate/Navigate";
import { useSelector } from "react-redux";
import { useSocketContext } from "../../contexts/SocketContext";

const UserLayout = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const socketContext = useSocketContext();

  useEffect(() => {
    if (isAuthenticated && user?.user?._id && socketContext?.joinRoom) {
      console.log("Joining user room:", user.user._id);
      socketContext.joinRoom(user.user._id);
    }
  }, [isAuthenticated, user, socketContext]);

  if (isAuthenticated === undefined) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  return (
    <div className="flex justify-center min-h-screen bg-surface">
      {/* Left Sidebar (Navigation) - Fixed */}
      {user?.role !== "admin" && (
        <div className="hidden md:flex flex-col w-[80px] xl:w-[275px] fixed left-0 top-0 h-full shadow-md z-50">
           <Navigate />
        </div>
      )}

      {/* Main Content Area */}
      {/* Added margin-left to offset fixed position sidebar */}
      <main className={`flex-1 w-full min-h-screen ${user?.role !== "admin" ? "md:ml-[80px] xl:ml-[275px]" : ""}`}>
          <div className="w-full h-full">
              <Outlet />
          </div>
      </main>
      
      {/* Mobile Navigation Placeholder (Typically X has bottom nav for mobile) */}
      {/* Navigate component can handle mobile view internally or we can add a specific mobile bar here */}
      {user?.role !== "admin" && (
         <div className="md:hidden fixed bottom-0 w-full z-50  bg-surface">
             <Navigate mobile={true} />
         </div>
      )}
    </div>
  );
};

export default UserLayout;
