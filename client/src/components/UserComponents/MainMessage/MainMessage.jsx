import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Edit,
  MessageSquare,
  Trash2,
  X,
  ChevronRight,
  Users,
  Bell,
} from "lucide-react";
import { messageManager } from "../../../socket/messageManager";
import { toast } from "react-hot-toast";
import { useOnlineUsers } from "../../../contexts/OnlineUsersContext";
import MessageService from "../../../services/messageService";

const MainMessage = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const { isUserOnline } = useOnlineUsers();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newMessageMode, setNewMessageMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  useEffect(() => {
    fetchConversations();

    const unsubscribeNewMessage = messageManager.onNewMessage(handleNewMessage);
    const unsubscribeMessageRead =
      messageManager.onMessageRead(handleMessageRead);
    const unsubscribeMessageDeleted =
      messageManager.onMessageDeleted(handleMessageDeleted);

    if (user && user._id) {
      messageManager.joinRoom(user._id);
    }

    return () => {
      unsubscribeNewMessage();
      unsubscribeMessageRead();
      unsubscribeMessageDeleted();

      if (user && user._id) {
        messageManager.leaveRoom(user._id);
      }
    };
  }, [user]);

  const handleNewMessage = useCallback(
    (data) => {
      console.log("MainMessage handling new message:", data);

      if (!data) return;

      const message = data.message || data;

      if (!message || !message._id) {
        console.warn("Invalid message format received:", data);
        return;
      }

      setConversations((prevConversations) => {
        const otherUserId =
          message.sender._id === user._id
            ? message.receiver._id
            : message.sender._id;

        const conversationExists = prevConversations.some(
          (conv) => conv._id.toString() === otherUserId.toString()
        );

        let updatedConversations;

        if (conversationExists) {
          updatedConversations = prevConversations.map((conv) => {
            if (conv._id.toString() === otherUserId.toString()) {
              const newUnreadCount =
                message.receiver._id === user._id && !message.isRead
                  ? (conv.unreadCount || 0) + 1
                  : conv.unreadCount || 0;

              return {
                ...conv,
                latestMessage: message,
                unreadCount: newUnreadCount,
                timestamp: new Date(message.createdAt).getTime(),
              };
            }
            return conv;
          });
        } else {
          const otherUser =
            message.sender._id === user._id ? message.receiver : message.sender;

          const newConversation = {
            _id: otherUserId,
            user: otherUser,
            latestMessage: message,
            unreadCount:
              message.receiver._id === user._id && !message.isRead ? 1 : 0,
            timestamp: new Date(message.createdAt).getTime(),
          };

          updatedConversations = [newConversation, ...prevConversations];
        }

        return updatedConversations.sort((a, b) => {
          const timeA =
            a.timestamp ||
            (a.latestMessage
              ? new Date(a.latestMessage.createdAt).getTime()
              : 0);
          const timeB =
            b.timestamp ||
            (b.latestMessage
              ? new Date(b.latestMessage.createdAt).getTime()
              : 0);
          return timeB - timeA;
        });
      });
    },
    [user]
  );

  const handleMessageRead = useCallback((data) => {
    if (data) {
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
  }, []);

  const handleMessageDeleted = useCallback((data) => {
    if (data && data.messageId) {
      setConversations((prevConversations) => {
        const affectedConversation = prevConversations.find(
          (conv) =>
            conv.latestMessage && conv.latestMessage._id === data.messageId
        );

        if (affectedConversation) {
          fetchConversations();
        }
        return prevConversations;
      });
    }
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      if (!import.meta.env.VITE_API_BASE_URL) {
        console.error("API URL not configured. Please check .env file");
        toast.error("API configuration missing. Please contact admin.");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No auth token found");
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate("/login");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/messages/conversations`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error === "jwt expired") {
              const refreshed = await refreshToken();
              if (refreshed) return fetchConversations();
            }
          } catch (parseErr) {
            console.error("Error parsing error response:", parseErr);
          }
        }
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();

      if (data.code === 1) {
        if (Array.isArray(data.data) && data.data.length > 0) {
          setConversations(data.data);
        } else {
          setConversations([]);
        }
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      if (process.env.NODE_ENV === "production") {
        toast.error(err.message || "Error fetching conversations");
      }
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem("refreshToken");
      if (!refreshTokenValue) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate("/login");
        return false;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refreshToken: refreshTokenValue,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      if (data.code === 1 && data.data?.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
        return true;
      } else {
        throw new Error(data.message || "Failed to refresh token");
      }
    } catch (err) {
      console.error("Error refreshing token:", err);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      navigate("/login");
      return false;
    }
  };

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
          const filteredResults = data.data.filter(
            (u) =>
              !selectedUsers.some((su) => su._id === u._id) &&
              u._id !== user?._id
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
  }, [searchTerm, selectedUsers, newMessageMode, user]);

  const goToMessageDetail = (userId) => {
    if (userId === user?._id) {
      toast.error("Không thể nhắn tin cho chính mình");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    let currentUser = user;
    if (!currentUser || !currentUser._id) {
      try {
        const storedUserStr = localStorage.getItem("user");
        if (storedUserStr) {
          currentUser = JSON.parse(storedUserStr);
        }
      } catch (err) {
        console.error("Error parsing user data from localStorage:", err);
        toast.error("Error loading user data. Please try logging in again.");
      }
    }

    const conversation = conversations.find((c) => c._id === userId);
    const selectedUser = conversation?.user;

    if (selectedUser) {
      sessionStorage.setItem(
        `selectedUser_${userId}`,
        JSON.stringify(selectedUser)
      );
    }

    navigate(`/messages/${userId}`, {
      state: {
        selectedUser: selectedUser,
        currentUser: currentUser,
        isInitialLoad: true,
        timestamp: Date.now(),
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

  const handleDelete = (e, conversation) => {
    e.stopPropagation();
    setConversationToDelete(conversation);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }

      const otherUserId = conversationToDelete._id;
      console.log(
        `Attempting to delete conversation with user: ${otherUserId}`
      );

      const response = await MessageService.deleteConversation(otherUserId);

      if (response.success) {
        setConversations(
          conversations.filter((conv) => conv._id !== conversationToDelete._id)
        );

        if (user && user._id) {
          messageManager.deleteConversation({
            userId: user._id,
            otherUserId: conversationToDelete._id,
          });
        }

        toast.success("Đã xóa cuộc trò chuyện");
      } else {
        console.error("Delete conversation failed:", response);
        toast.error(response.message || "Không thể xóa cuộc trò chuyện");
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
      toast.error("Có lỗi xảy ra khi xóa cuộc trò chuyện");
    } finally {
      setShowDeleteModal(false);
      setConversationToDelete(null);
    }
  };

  const filteredConversations = conversations.filter((conversation) => {
    if (!searchTerm) return true;
    const username = conversation.user?.username || "";
    const name = conversation.user?.name || "";
    const searchLower = searchTerm.toLowerCase();
    return (
      username.toLowerCase().includes(searchLower) ||
      name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="h-full flex flex-col bg-white  shadow-sm overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
        {newMessageMode ? (
          <>
            <div className="flex items-center">
              <button
                className="mr-3 p-2 rounded-full hover:bg-gray-50 text-gray-600 transition-all duration-200"
                onClick={() => {
                  setNewMessageMode(false);
                  setSelectedUsers([]);
                  setSearchTerm("");
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-lg font-semibold text-gray-800">
                New Message
              </h2>
            </div>
            <button
              onClick={startNewConversation}
              disabled={selectedUsers.length === 0}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedUsers.length === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              Next
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold flex items-center text-gray-800">
              <MessageSquare size={22} className="mr-2 text-indigo-600" />
              Messages
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setNewMessageMode(true)}
                className="p-2.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all duration-200"
                aria-label="New message"
              >
                <Edit size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* New message mode */}
      {newMessageMode ? (
        <div className="flex flex-col h-full">
          <div className="px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
            <div className="flex flex-wrap items-center p-2 bg-gray-50 rounded-lg">
              <span className="mr-2 text-sm text-gray-600 font-medium">
                To:
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="bg-indigo-50 rounded-full px-3 py-1.5 flex items-center text-sm shadow-sm border border-indigo-100"
                  >
                    <span className="text-indigo-700 font-medium">
                      {user.username || user.name}
                    </span>
                    <button
                      className="ml-1.5 p-0.5 rounded-full text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100"
                      onClick={() => removeSelectedUser(user._id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow outline-none border-none text-sm py-1.5 min-w-[120px] bg-transparent placeholder-gray-400"
                  placeholder="Type a name..."
                />
              </div>
            </div>
          </div>

          {/* Search results */}
          <div className="flex-grow overflow-y-auto scrollbar-hide bg-white">
            {isSearching ? (
              <div className="flex justify-center items-center h-16 py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              searchResults.length > 0 && (
                <div className="p-3">
                  <h3 className="text-gray-500 text-xs mb-2 px-2 uppercase tracking-wide font-medium">
                    People
                  </h3>
                  <div className="space-y-1">
                    {searchResults.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                        onClick={() => handleSelectUser(user)}
                      >
                        <div className="relative">
                          <img
                            src={
                              user.avatar || "https://via.placeholder.com/40"
                            }
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover mr-3 border border-gray-200"
                          />
                          {isUserOnline(user._id) && (
                            <div className="absolute bottom-0.5 right-3.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {user.username || user.name}
                          </p>
                          <p className="text-gray-500 text-sm">{user.name}</p>
                        </div>
                        <ChevronRight
                          className="ml-auto text-gray-400"
                          size={16}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {searchTerm && !isSearching && searchResults.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center p-8 mt-8">
                <Users size={40} className="text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">
                  No users found matching "{searchTerm}"
                </p>
              </div>
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
                placeholder="Search conversations"
                className="w-full py-2.5 pl-10 pr-3 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent text-sm transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                className="absolute left-3.5 top-3 text-gray-400"
                size={16}
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-grow overflow-y-auto px-3 pb-2 scrollbar-hide">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-l-2 border-indigo-600"></div>
              </div>
            ) : filteredConversations.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    className="relative rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <div
                      className="flex items-center p-3 cursor-pointer"
                      onClick={() => goToMessageDetail(conversation._id)}
                    >
                      <div className="relative">
                        <img
                          src={
                            conversation.user?.avatar ||
                            "https://via.placeholder.com/40"
                          }
                          alt={conversation.user?.username}
                          className="w-13 h-13 rounded-full object-cover mr-3 border border-gray-200 shadow-sm"
                        />
                        {isUserOnline(conversation._id) && (
                          <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-grow mr-2">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-gray-800">
                            {conversation.user?.name}
                          </p>
                          <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatTime(conversation.latestMessage.createdAt)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p
                            className={`text-sm truncate max-w-[210px] ${
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
                            <div className="flex items-center justify-center min-w-[20px] h-[20px] bg-indigo-600 rounded-full text-white text-xs px-1.5 font-medium ml-2">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete button - visible on hover */}
                    <button
                      onClick={(e) => handleDelete(e, conversation)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
                      aria-label="Delete conversation"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[70%] text-center p-4 animate-fadeIn">
                <div className="rounded-full bg-indigo-50 p-5 mb-4">
                  <MessageSquare size={28} className="text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">
                  Your Messages
                </h3>
                <p className="text-gray-500 text-sm mb-5 max-w-[250px]">
                  Send private photos and messages to a friend or group
                </p>
                <button
                  onClick={() => setNewMessageMode(true)}
                  className="bg-indigo-600 text-white text-sm px-5 py-2.5 rounded-full hover:bg-indigo-700 transition-all duration-300 shadow-sm flex items-center"
                >
                  <Edit size={16} className="mr-2" />
                  Send Message
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Xóa cuộc trò chuyện
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 p-1 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa cuộc trò chuyện với{" "}
              <span className="font-medium">
                {conversationToDelete?.user?.name}
              </span>
              ? Tất cả tin nhắn sẽ bị xóa vĩnh viễn.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainMessage;
