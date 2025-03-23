import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Edit, MessageSquare } from "lucide-react";
import { socket } from "../../../socket";
import { messageManager } from "../../../socket/messageManager";
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

    // Đăng ký lắng nghe tin nhắn mới
    const unsubscribeNewMessage = messageManager.onNewMessage((data) => {
      if (data && data.message) {
        // Cập nhật danh sách hội thoại với tin nhắn mới
        setConversations((prevConversations) => {
          const message = data.message;
          const otherUserId =
            message.sender._id === user._id
              ? message.receiver._id
              : message.sender._id;

          // Kiểm tra xem hội thoại đã tồn tại chưa
          const conversationExists = prevConversations.some(
            (conv) => conv._id.toString() === otherUserId.toString()
          );

          if (conversationExists) {
            // Cập nhật hội thoại hiện có
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
            // Đây là hội thoại mới
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
    });

    // Đăng ký lắng nghe đánh dấu đã đọc
    const unsubscribeMessageRead = messageManager.onMessageRead((data) => {
      if (data) {
        // Cập nhật hội thoại để đánh dấu tin nhắn là đã đọc
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
    });

    // Đăng ký nhận thông báo tin nhắn đã xóa
    const unsubscribeMessageDeleted = messageManager.onMessageDeleted(
      (data) => {
        if (data && data.messageId) {
          // Xóa tin nhắn khỏi UI nếu cần thiết
          setConversations((prevConversations) => {
            return prevConversations.map((conv) => {
              if (conv.latestMessage._id === data.messageId) {
                // Cần fetch tin nhắn mới nhất
                fetchConversations();
                return conv;
              }
              return conv;
            });
          });
        }
      }
    );

    // Đăng ký nhận phòng chat cá nhân
    if (user && user._id) {
      messageManager.joinRoom(user._id);
    }

    // Clear các đăng ký khi component unmount
    return () => {
      unsubscribeNewMessage();
      unsubscribeMessageRead();
      unsubscribeMessageDeleted();

      if (user && user._id) {
        messageManager.leaveRoom(user._id);
      }
    };
  }, [user]);

  // Handle search users
  useEffect(() => {
    if (!newMessageMode) return;

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
          }/api/users/search?term=${encodeURIComponent(searchTerm)}`,
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
          // Filter out already selected users
          const filteredResults = data.data.filter(
            (u) => !selectedUsers.some((su) => su._id === u._id)
          );
          setSearchResults(filteredResults);
        } else {
          toast.error(data.message || "Something went wrong");
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedUsers, newMessageMode]);

  const goToMessageDetail = (userId) => {
    // Kiểm tra nếu không có dữ liệu người dùng hoặc token
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("No auth token found");
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    let currentUser = user;
    // Nếu không tìm thấy user từ Redux, thử lấy từ localStorage
    if (!currentUser || !currentUser._id) {
      try {
        const storedUserStr = localStorage.getItem("user");
        if (storedUserStr) {
          currentUser = JSON.parse(storedUserStr);
          console.log("Using user data from localStorage:", currentUser._id);
        } else {
          console.error("No user data found in localStorage");
          // Không chuyển hướng ngay, cố gắng tiếp tục
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
      }
    }

    // Tìm thông tin cuộc trò chuyện từ danh sách hiện có
    const conversation = conversations.find((c) => c._id === userId);
    const selectedUser = conversation?.user;

    console.log("Navigating to message detail for user:", userId);
    console.log("Selected user data:", selectedUser);

    // Lưu thông tin user được chọn vào sessionStorage để khôi phục nếu cần
    if (selectedUser) {
      sessionStorage.setItem(
        `selectedUser_${userId}`,
        JSON.stringify(selectedUser)
      );
    }

    // Navigate to the MessageDetail route with the user ID and user data
    navigate(`/messages/${userId}`, {
      state: {
        selectedUser: selectedUser,
        currentUser: currentUser,
      },
    });
  };

  const handleSelectUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchTerm("");
    setSearchResults([]);
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((user) => user._id !== userId));
  };

  const startNewConversation = () => {
    // Navigate to the MessageDetail route with the first selected user ID
    if (selectedUsers.length > 0) {
      goToMessageDetail(selectedUsers[0]._id);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const isToday = date.toDateString() === now.toDateString();
    const isYesterday =
      new Date(now.setDate(now.getDate() - 1)).toDateString() ===
      date.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (isYesterday) {
      return "Yesterday";
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      // Within last week
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

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
    <div className="h-[calc(100vh-160px)] flex flex-col bg-white rounded-tl-2xl rounded-bl-2xl overflow-hidden border-t border-l border-b border-gray-300">
      {/* Header - simple heading with new message button */}
      <div className="p-4 py-3.5 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm flex-shrink-0">
        {newMessageMode ? (
          <>
            <div className="flex items-center">
              <button
                className="mr-3 p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-all duration-200"
                onClick={() => {
                  setNewMessageMode(false);
                  setSelectedUsers([]);
                  setSearchTerm("");
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-base font-semibold text-gray-700">
                New Message
              </h2>
            </div>
            <button
              onClick={startNewConversation}
              disabled={selectedUsers.length === 0}
              className={`${
                selectedUsers.length === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-indigo-600 hover:text-indigo-700 cursor-pointer"
              } text-sm font-medium transition-colors duration-200`}
            >
              Next
            </button>
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold flex items-center text-gray-700">
              <MessageSquare size={20} className="mr-2 text-indigo-600" />
              Messages
            </h2>
            <button
              onClick={() => setNewMessageMode(true)}
              className="p-2 rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all duration-200"
            >
              <Edit size={18} />
            </button>
          </>
        )}
      </div>

      {/* New message mode */}
      {newMessageMode ? (
        <div className="flex flex-col h-full">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex flex-wrap items-center">
              <span className="mr-2 text-sm text-gray-600 font-medium">
                To:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="bg-gray-200 rounded-full px-3 py-1 flex items-center text-xs shadow-sm border border-gray-300"
                  >
                    <span className="text-gray-700">
                      {user.username || user.fullname}
                    </span>
                    <button
                      className="ml-1.5 text-gray-500 hover:text-gray-700"
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
                  className="flex-grow outline-none border-none text-sm py-1 min-w-[120px] bg-transparent"
                  placeholder="Search..."
                />
              </div>
            </div>
          </div>

          {/* Search results */}
          <div className="flex-grow overflow-y-auto scrollbar-hide">
            {isSearching ? (
              <div className="flex justify-center items-center h-16 py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
              </div>
            ) : (
              searchResults.length > 0 && (
                <div className="p-2">
                  <h3 className="text-gray-500 text-xs mb-1.5 px-3 pt-1.5 uppercase tracking-wide font-medium">
                    Suggested
                  </h3>
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className="flex items-center p-2.5 hover:bg-gray-50 rounded-lg cursor-pointer mx-1 transition-all duration-200"
                    >
                      <img
                        src={user.avatar || "https://via.placeholder.com/40"}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                      <div>
                        <p className="font-medium text-sm text-gray-800">
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
          {/* Search bar */}
          <div className="px-4 py-3 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search messages"
                className="w-full py-2 pl-10 pr-3 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-transparent text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                className="absolute left-3.5 top-2.5 text-gray-400"
                size={16}
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-grow overflow-y-auto px-2 pb-2 scrollbar-hide">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : conversations.length > 0 ? (
              <div className="space-y-1">
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
                      className="flex items-center p-3 hover:bg-gray-50 rounded-xl cursor-pointer mx-1 transition-all duration-200"
                      onClick={() => goToMessageDetail(conversation._id)}
                    >
                      <div className="relative">
                        <img
                          src={
                            conversation.user.avatar ||
                            "https://via.placeholder.com/40"
                          }
                          alt={
                            conversation.user.username ||
                            conversation.user.fullname
                          }
                          className="w-12 h-12 rounded-full object-cover mr-3"
                        />
                        {/* Online indicator */}
                        {conversation.user.online && (
                          <div className="absolute bottom-0.5 right-3.5 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                        )}
                      </div>
                      <div className="flex-grow mr-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-gray-800">
                            {conversation.user.username ||
                              conversation.user.fullname}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(conversation.latestMessage.createdAt)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-0.5">
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
                            <div className="flex items-center justify-center min-w-[18px] h-[18px] bg-indigo-600 rounded-full text-white text-xs px-1 font-medium">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4 animate-fadeIn">
                <div className="rounded-full bg-gray-100 p-4 mb-4">
                  <MessageSquare size={24} className="text-gray-600" />
                </div>
                <h3 className="text-base font-semibold mb-2 text-gray-700">
                  Your Messages
                </h3>
                <p className="text-gray-500 text-sm mb-4 max-w-[200px]">
                  Send private photos and messages to a friend
                </p>
                <button
                  onClick={() => setNewMessageMode(true)}
                  className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-full hover:bg-indigo-700 transition-all duration-300"
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
