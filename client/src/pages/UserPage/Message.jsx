import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import MainMessage from "../../components/features/chat/MainMessage";

function Message() {
  const location = useLocation();
  const { pathname } = location;

  const isDetailRoute = pathname.includes("/messages/");

  useEffect(() => {
    document.title = isDetailRoute ? "Conversation / YiBu" : "Messages / YiBu";
  }, [isDetailRoute]);

  // Redesigned to be full width/height like X (Twitter)
  return (
    <div className="flex w-full h-[100dvh]">
      {/* Left Sidebar (Message List) */}
      <div
        className={`w-full md:w-[380px] lg:w-[400px]  flex-shrink-0 ${
          isDetailRoute ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="w-full h-full border-r border-gray-200">
           <MainMessage />
        </div>
      </div>

      {/* Right Content (Chat Detail or Empty State) */}
      <div
        className={`flex-1 min-w-0 ${
          isDetailRoute ? "flex" : "hidden md:flex"
        }`}
      >
        {isDetailRoute ? (
          <Outlet />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
             <div className="max-w-md">
                <h2 className="text-3xl font-bold text-text-primary mb-2">Select a message</h2>
                <p className="text-text-secondary mb-6">Choose from your existing conversations, start a new one, or just keep swimming.</p>
                <button className="px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all text-sm">
                   New message
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Message;
