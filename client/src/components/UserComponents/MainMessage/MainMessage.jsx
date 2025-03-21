import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Edit, Send } from "lucide-react";
import { socket } from "../../../socket";
import { toast } from "react-hot-toast";

const MainMessage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newMessageMode, setNewMessageMode] = useState(false);

  // Fetch conversations when component mounts
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        if (!import.meta.env.VITE_API_BASE_URL) {
          console.error("API URL not configured. Please check .env file");
          toast.error("API configuration missing. Please contact admin.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/messages/conversations`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch conversations");
        }

        const data = await response.json();

        if (data.code === 1) {
          setConversations(data.data);
        } else {
          toast.error(data.message || "Something went wrong");
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        // Prevent showing error toast in development if server is not running
        if (process.env.NODE_ENV === "production") {
          toast.error(error.message || "Error fetching conversations");
        }
        // Set empty conversations to avoid UI errors
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Listen for new messages
    if (socket) {
      const handleNewMessage = (data) => {
        if (data && data.message) {
          // Update conversations with the new message
          setConversations((prevConversations) => {
            const message = data.message;
            const otherUserId =
              message.sender._id === user._id
                ? message.receiver._id
                : message.sender._id;

            // Check if conversation exists
            const conversationExists = prevConversations.some(
              (conv) => conv._id.toString() === otherUserId.toString()
            );

            if (conversationExists) {
              // Update existing conversation
              return prevConversations
                .map((conv) => {
                  if (conv._id.toString() === otherUserId.toString()) {
                    return {
                      ...conv,
                      latestMessage: message,
                      unreadCount:
                        message.receiver._id === user._id && !message.isRead
                          ? conv.unreadCount + 1
                          : conv.unreadCount,
                    };
                  }
                  return conv;
                })
                .sort((a, b) => {
                  return (
                    new Date(b.latestMessage.createdAt) -
                    new Date(a.latestMessage.createdAt)
                  );
                });
            } else {
              // It's a new conversation
              const newConversation = {
                _id: otherUserId,
                user:
                  message.sender._id === user._id
                    ? message.receiver
                    : message.sender,
                latestMessage: message,
                unreadCount:
                  message.receiver._id === user._id && !message.isRead ? 1 : 0,
              };

              return [newConversation, ...prevConversations];
            }
          });
        }
      };

      socket.on("new_message", handleNewMessage);

      return () => {
        socket.off("new_message", handleNewMessage);
      };
    }
  }, [user]);

  // Handle message mark as read
  useEffect(() => {
    if (socket) {
      const handleMessageRead = (data) => {
        if (data) {
          // Update conversations to mark messages as read
          setConversations((prevConversations) => {
            return prevConversations.map((conv) => {
              if (
                data.messageIds &&
                data.messageIds.includes(conv.latestMessage._id)
              ) {
                return {
                  ...conv,
                  latestMessage: { ...conv.latestMessage, isRead: true },
                  unreadCount: 0,
                };
              }
              return conv;
            });
          });
        }
      };

      socket.on("message_read", handleMessageRead);

      return () => {
        socket.off("message_read", handleMessageRead);
      };
    }
  }, []);

  // Handle search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/users/search?query=${searchTerm}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to search users");
        }

        const data = await response.json();

        if (data.code === 1) {
          setSearchResults(data.data.filter((u) => u._id !== user._id));
        } else {
          toast.error(data.message || "Something went wrong with search");
        }
      } catch (error) {
        console.error("Error searching users:", error);
        toast.error(error.message || "Error searching users");
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      if (newMessageMode && searchTerm.trim()) {
        searchUsers();
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchTerm, newMessageMode, user._id]);

  // Navigate to message detail
  const goToMessageDetail = (userId) => {
    navigate(`/messages/${userId}`, {
      state: {
        selectedUser: conversations.find((c) => c._id === userId)?.user,
      },
    });
  };

  // Handle selecting user for new message
  const handleSelectUser = (user) => {
    if (!selectedUsers.some((u) => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchTerm("");
  };

  // Remove user from selection
  const removeSelectedUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== userId));
  };

  // Start new conversation
  const startNewConversation = () => {
    if (selectedUsers.length === 1) {
      goToMessageDetail(selectedUsers[0]._id);
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Display message preview with truncation
  const getMessagePreview = (message) => {
    if (!message) return "";

    if (message.media) {
      return "Sent a photo";
    }

    return message.content.length > 30
      ? `${message.content.substring(0, 30)}...`
      : message.content;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header - Instagram style */}
      <div className="p-4 border-b flex items-center justify-between">
        {newMessageMode ? (
          <>
            <div className="flex items-center">
              <button
                className="mr-3"
                onClick={() => {
                  setNewMessageMode(false);
                  setSelectedUsers([]);
                  setSearchTerm("");
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-base font-semibold">New Message</h2>
            </div>
            <button
              onClick={startNewConversation}
              disabled={selectedUsers.length === 0}
              className={`${
                selectedUsers.length === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-500 cursor-pointer"
              } text-sm font-medium`}
            >
              Next
            </button>
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold flex items-center">
              {user?.username || "Messages"}
            </h2>
            <button
              onClick={() => setNewMessageMode(true)}
              className="text-gray-800 hover:text-gray-600"
            >
              <Edit size={18} />
            </button>
          </>
        )}
      </div>

      {/* New Message UI */}
      {newMessageMode ? (
        <div className="flex flex-col h-full">
          <div className="px-4 py-2 border-b">
            <div className="flex flex-wrap items-center">
              <span className="mr-2 text-sm text-gray-600">To:</span>
              <div className="flex flex-wrap gap-1">
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="bg-blue-50 rounded-full px-2 py-0.5 flex items-center text-xs"
                  >
                    <span>{user.username || user.fullname}</span>
                    <button
                      className="ml-1 text-gray-500 hover:text-gray-700"
                      onClick={() => removeSelectedUser(user._id)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow outline-none border-none text-sm py-1 min-w-[120px]"
                  placeholder="Search..."
                />
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-grow overflow-y-auto">
            {isSearching ? (
              <div className="flex justify-center items-center h-16 py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              searchResults.length > 0 && (
                <div className="p-1">
                  <h3 className="text-gray-500 text-xs mb-1 px-3 pt-1">
                    Suggested
                  </h3>
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer mx-1"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden mr-2">
                        <img
                          src={user.avatar || "https://via.placeholder.com/40"}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {user.username || user.fullname}
                        </p>
                        <p className="text-gray-500 text-xs">{user.fullname}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Search Bar - Instagram style */}
          <div className="px-4 py-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full py-1.5 pl-8 pr-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                className="absolute left-2.5 top-2 text-gray-400"
                size={16}
              />
            </div>
          </div>

          {/* Conversations List - Instagram style */}
          <div className="flex-grow overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
              </div>
            ) : conversations.length > 0 ? (
              <div className="px-1">
                {conversations
                  .filter(
                    (conversation) =>
                      !searchTerm ||
                      conversation.user.username
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      conversation.user.fullname
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
                  )
                  .map((conversation) => (
                    <div
                      key={conversation._id}
                      className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer mx-1"
                      onClick={() => goToMessageDetail(conversation._id)}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                          <img
                            src={
                              conversation.user.avatar ||
                              "https://via.placeholder.com/40"
                            }
                            alt={
                              conversation.user.username ||
                              conversation.user.fullname
                            }
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Online indicator - Instagram style */}
                        {conversation.user.online && (
                          <div className="absolute bottom-0.5 right-3.5 w-2.5 h-2.5 bg-green-500 rounded-full border-[1.5px] border-white"></div>
                        )}
                      </div>
                      <div className="flex-grow mr-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm text-gray-900">
                            {conversation.user.username ||
                              conversation.user.fullname}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(conversation.latestMessage.createdAt)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p
                            className={`text-xs truncate max-w-[180px] ${
                              conversation.unreadCount > 0
                                ? "text-gray-900 font-medium"
                                : "text-gray-500"
                            }`}
                          >
                            {conversation.latestMessage.sender === user._id
                              ? "You: "
                              : ""}
                            {getMessagePreview(conversation.latestMessage)}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                <div className="rounded-full bg-gray-100 p-3 mb-3">
                  <Send size={20} className="text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold mb-1">Your Messages</h3>
                <p className="text-gray-500 text-xs mb-3 max-w-[200px]">
                  Send private photos and messages to a friend
                </p>
                <button
                  onClick={() => setNewMessageMode(true)}
                  className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-md hover:bg-blue-600"
                >
                  Send Message
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MainMessage;
