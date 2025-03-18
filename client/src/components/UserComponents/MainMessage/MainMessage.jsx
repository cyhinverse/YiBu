import React, { useState, useEffect } from "react";
import { Ellipsis, Search } from "lucide-react";
import MessageOptions from "../Messages/MessageOptions";
import MessageContents from "../Messages/MessageContents";
import { useSelector } from "react-redux";

const MainMessage = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const token = useSelector((state) => state.auth.token);
  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:9785/user/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log("Fetched users:", data); // Để debug
      if (data.success) {
        setUsers(data.data);
        setFilteredUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "long" });
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleUserSelect = (user) => {
    console.log("Selected user:", user); // Để debug
    setSelectedUser(user);
  };

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
            <Ellipsis className="cursor-pointer hover:opacity-70" />
            <MessageOptions showOptions={showOptions} />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            type="text"
            className="w-full h-[40px] pl-10 pr-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-purple-400 transition-all"
          />
        </div>

        {/* List Users */}
        <div className="flex flex-col gap-2 overflow-y-auto pr-2 max-h-[calc(86vh-150px)] scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 hover:[&::-webkit-scrollbar-thumb]:bg-purple-400">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => handleUserSelect(user)}
                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-purple-100 cursor-pointer transition-all ${
                  selectedUser?._id === user._id ? "bg-purple-100" : ""
                }`}
              >
                <img
                  src={user.avatar || "https://via.placeholder.com/45"}
                  alt={user.username}
                  className="w-[45px] h-[45px] rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{user.username}</span>
                    <span className="text-xs text-gray-500">
                      {formatTime(user.lastMessage?.time)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 truncate">
                      {user.lastMessage?.content || "No messages yet"}
                    </p>
                    {user.unreadCount > 0 && (
                      <span className="bg-purple-500 text-white rounded-full px-2 py-1 text-xs">
                        {user.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">No users found</div>
          )}
        </div>
      </div>

      {/* Chat content */}
      <div className="w-full h-full flex-1 rounded-xl">
        {selectedUser ? (
          <MessageContents selectedUser={selectedUser} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default MainMessage;
