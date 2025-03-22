import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import MainMessage from "../../components/UserComponents/MainMessage/MainMessage";
import { useSelector } from "react-redux";

function Message() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;

  // Check if we're on a specific message detail route
  const isDetailRoute = pathname.includes("/messages/");

  // Get the user's data for identification
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Update title based on route
    document.title = isDetailRoute ? "Conversation | YiBu" : "Messages | YiBu";
  }, [isDetailRoute]);

  return (
    <div className="w-full px-4 py-3">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row h-[calc(100vh-160px)] bg-gray-50/50 rounded-2xl shadow-lg overflow-hidden border border-gray-300">
          {/* Users list - always shown on desktop, hidden on mobile in detail view */}
          <div
            className={`w-full md:w-2/5 md:border-r border-gray-300 ${
              isDetailRoute ? "hidden md:block" : ""
            }`}
          >
            <MainMessage />
          </div>

          {/* Message detail or placeholder */}
          <div
            className={`w-full md:w-3/5 ${
              isDetailRoute ? "" : "hidden md:flex"
            }`}
          >
            {isDetailRoute ? (
              <Outlet />
            ) : (
              <div className="flex items-center justify-center h-full bg-white rounded-tr-2xl rounded-br-2xl border-t border-r border-b border-gray-100">
                <div className="text-center p-8">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-500"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Your Messages
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Select a conversation from the list or start a new message
                    to begin chatting.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Message;
