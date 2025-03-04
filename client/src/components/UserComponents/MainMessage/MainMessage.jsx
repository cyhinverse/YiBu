import React, { useState } from "react";
import { Ellipsis, Search } from "lucide-react";
import MessageOptions from "../Messages/MessageOptions";
import MessageContents from "../Messages/MessageContents";
import { MiniPlayerMess } from "../Messages";

const MainMessage = () => {
  const [search, setSearch] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const users = [
    {
      id: 1,
      name: "Emma Watson",
      lastMessage: "See you tomorrow!",
      time: "10:45 AM",
      avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    },
    {
      id: 2,
      name: "John Doe",
      lastMessage: "Let's catch up later.",
      time: "9:30 AM",
      avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    },
    {
      id: 3,
      name: "Taylor Swift",
      lastMessage: "Check your email.",
      time: "Yesterday",
      avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    },
    {
      id: 4,
      name: "Chris Evans",
      lastMessage: "Meeting at 3 PM.",
      time: "Monday",
      avatar: "https://randomuser.me/api/portraits/men/4.jpg",
    },
    {
      id: 5,
      name: "Ariana Grande",
      lastMessage: "Thanks for the gift!",
      time: "Sunday",
      avatar: "https://randomuser.me/api/portraits/women/5.jpg",
    },
    {
      id: 6,
      name: "Robert Downey Jr.",
      lastMessage: "Iron Man out.",
      time: "Saturday",
      avatar: "https://randomuser.me/api/portraits/men/6.jpg",
    },
    {
      id: 7,
      name: "Zendaya",
      lastMessage: "Call me later.",
      time: "Friday",
      avatar: "https://randomuser.me/api/portraits/women/7.jpg",
    },
    {
      id: 8,
      name: "Tom Holland",
      lastMessage: "On my way!",
      time: "Thursday",
      avatar: "https://randomuser.me/api/portraits/men/8.jpg",
    },
    {
      id: 9,
      name: "Scarlett Johansson",
      lastMessage: "Got your email.",
      time: "Wednesday",
      avatar: "https://randomuser.me/api/portraits/women/9.jpg",
    },
    {
      id: 10,
      name: "Chris Hemsworth",
      lastMessage: "Thor is ready.",
      time: "Tuesday",
      avatar: "https://randomuser.me/api/portraits/men/10.jpg",
    },
    {
      id: 11,
      name: "Selena Gomez",
      lastMessage: "See you at the party.",
      time: "1 week ago",
      avatar: "https://randomuser.me/api/portraits/women/11.jpg",
    },
    {
      id: 12,
      name: "Will Smith",
      lastMessage: "Good morning!",
      time: "2 weeks ago",
      avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    },
  ];

  return (
    <div className="w-[95vw] h-[86vh] bg-purple-50 m-auto rounded-xl mt-5 shadow-2xl flex gap-2 justify-between">
      {/* Sidebar */}
      <div className="w-[25%] h-full bg-white shadow-xl border border-gray-300 rounded-xl p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-semibold">Messages</span>
          <div
            onClick={() => setShowOptions(!showOptions)}
            className="relative"
          >
            <Ellipsis className="cursor-pointer hover:opacity-70 " />
            <MessageOptions showOptions={showOptions} />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          {search && (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          )}
          <input
            onClick={() => setSearch(!search)}
            placeholder="Search message..."
            type="text"
            className="w-full h-[40px] pl-10 pr-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-purple-400 transition-all"
          />
        </div>

        {/* List Users */}
        <div
          className="flex flex-col gap-2 overflow-y-auto pr-2 max-h-[calc(86vh-150px)]
                    scroll-smooth
                    [&::-webkit-scrollbar]:w-2
                    [&::-webkit-scrollbar-track]:rounded-full
                    [&::-webkit-scrollbar-track]:bg-gray-100
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:bg-gray-400
                    hover:[&::-webkit-scrollbar-thumb]:bg-purple-400
                    dark:[&::-webkit-scrollbar-track]:bg-neutral-700
                    dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500
                    dark:hover:[&::-webkit-scrollbar-thumb]:bg-purple-600"
        >
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-100 cursor-pointer transition-all"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-[45px] h-[45px] rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-xs text-gray-500">{user.time}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {user.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat content */}
      <div className="w-[40%] h-full  rounded-xl ">
        <MessageContents />
      </div>
      <div className="w-[25%] h-full rounded-xl">
        <MiniPlayerMess />
      </div>
    </div>
  );
};

export default MainMessage;
