import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import MainMessage from "../../components/features/chat/MainMessage";

function Message() {
  const location = useLocation();
  const { pathname } = location;

  const isDetailRoute = pathname.includes("/messages/");

  useEffect(() => {
    document.title = isDetailRoute ? "Conversation | YiBu" : "Messages | YiBu";
  }, [isDetailRoute]);

  return (
    <div className="w-[95%] mx-auto py-3">
      <div className="w-full">
        <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] rounded-2xl shadow-lg overflow-hidden border border-gray-300">
          <div
            className={`w-full md:w-2/5 md:border-r border-gray-300 ${
              isDetailRoute ? "hidden md:block" : ""
            }`}
          >
            <MainMessage />
          </div>
          <div
            className={`w-full md:w-3/5 ${
              isDetailRoute ? "" : "hidden md:flex"
            }`}
          >
            {isDetailRoute ? (
              <Outlet />
            ) : (
              <div className="w-full h-full text-center justify-center items-center flex font-semibold text-gray-500 text-2xl">
                No message selected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Message;
