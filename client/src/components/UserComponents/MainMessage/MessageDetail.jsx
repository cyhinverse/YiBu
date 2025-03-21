import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Send,
  ArrowLeft,
  MoreVertical,
  Image,
  Smile,
  Heart,
  Mic,
  Info,
  Phone,
  Video,
} from "lucide-react";
import { socket } from "../../../socket";
import { toast } from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

const MessageDetail = () => {
  const { userId } = useParams(); // ID của người nhận
  const { user } = useSelector((state) => state.auth); // Người dùng hiện tại
  const navigate = useNavigate();
  const location = useLocation();

  // Console log cho debugging
  console.log("MessageDetail rendered with userId:", userId);
  console.log("Current authenticated user:", user);
  console.log("Location state:", location.state);

  // Nhận thông tin người dùng từ state navigation nếu có
  const selectedUserFromNav = location.state?.selectedUser;
  console.log("selectedUserFromNav:", selectedUserFromNav);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [receiverUser, setReceiverUser] = useState(selectedUserFromNav || null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageContainerRef = useRef(null);

  // Scroll to bottom khi có tin nhắn mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch thông tin người nhận
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!userId) {
        console.log("Skipping fetchUserInfo - no userId available");
        return;
      }

      // Sử dụng selectedUserFromNav nếu có
      if (selectedUserFromNav) {
        console.log("Using selectedUserFromNav:", selectedUserFromNav);
        setReceiverUser(selectedUserFromNav);
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching user info for ID:", userId);
        if (!import.meta.env.VITE_API_BASE_URL) {
          console.error("API URL not configured. Please check .env file");
          setLoadingError("API configuration missing. Please contact admin.");
          setLoading(false);
          return;
        }

        const url = `${import.meta.env.VITE_API_BASE_URL}/user/${userId}`;
        console.log("Fetching user from URL:", url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        console.log(
          "User API Response status:",
          response.status,
          response.statusText
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch user: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("User API response:", data);

        if (data.code === 1 && data.data) {
          console.log("User data received:", data.data);
          setReceiverUser(data.data);
        } else {
          console.error("API returned error for user:", data.message);
          setLoadingError(data.message || "Failed to load user information");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        // Luôn đặt thông báo lỗi và sử dụng dữ liệu mặc định cho testing
        setLoadingError(error.message || "Error loading user information");

        // Trong môi trường development, sử dụng dữ liệu mặc định để có thể test
        if (process.env.NODE_ENV !== "production") {
          setReceiverUser({
            _id: userId,
            username: "Test User",
            avatar: "https://via.placeholder.com/40",
          });
          console.log("Using fallback test user data in dev mode");
          setLoadingError(null); // Xóa lỗi để có thể xem giao diện
        }
      } finally {
        setLoading(false); // Luôn kết thúc loading dù có lỗi hay không
      }
    };

    fetchUserInfo();
  }, [userId, selectedUserFromNav]);

  // Fetch tin nhắn giữa hai người dùng
  useEffect(() => {
    const fetchMessages = async () => {
      const currentUserId = user?.user?._id; // Lấy ID từ cấu trúc đúng user.user._id

      if (!userId || !currentUserId) {
        console.log(
          "Skipping fetchMessages - missing userId or currentUserId",
          {
            userId,
            currentUserId,
          }
        );
        return;
      }

      try {
        console.log(
          "fetchMessages - Starting to fetch messages between",
          userId,
          "and",
          currentUserId
        );
        setLoading(true);
        setLoadingError(null); // Reset error state

        if (!import.meta.env.VITE_API_BASE_URL) {
          console.error("API URL not configured. Please check .env file");
          setLoadingError("API configuration missing. Please contact admin.");
          setLoading(false);
          return;
        }

        const url = `${
          import.meta.env.VITE_API_BASE_URL
        }/api/messages/${userId}`;
        console.log("Fetching messages from URL:", url);
        console.log(
          "Using access token:",
          localStorage.getItem("accessToken")?.substring(0, 15) + "..."
        );

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        console.log(
          "API Response status:",
          response.status,
          response.statusText
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          throw new Error(
            `Failed to fetch messages: ${response.status} ${response.statusText}. Details: ${errorText}`
          );
        }

        const data = await response.json();
        console.log("Messages API response:", data);

        if (data.code === 1) {
          const messageCount = data.data ? data.data.length : 0;
          console.log(`Successfully loaded ${messageCount} messages`);

          if (messageCount > 0) {
            console.log(
              "First message sample:",
              JSON.stringify(data.data[0], null, 2)
            );
          } else {
            console.log("No messages found - empty conversation");
          }

          setMessages(data.data || []);

          // Nếu có tin nhắn, scroll xuống dưới
          if (data.data && data.data.length > 0) {
            setTimeout(scrollToBottom, 100);
          }
        } else {
          console.error(
            "API returned error code:",
            data.code,
            "message:",
            data.message
          );
          setLoadingError(data.message || "Failed to load messages");
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        // Cung cấp thông báo lỗi rõ ràng
        setLoadingError(error.message || "Failed to load messages");

        // Trong development, vẫn cho phép UI hiển thị với messages rỗng
        if (process.env.NODE_ENV !== "production") {
          console.log("In development mode - showing empty messages UI");
          setMessages([]);
          // setLoadingError(null); // Không xóa lỗi để hiển thị trong console
        }
      } finally {
        console.log(
          "Finished fetchMessages attempt - setting loading to false"
        );
        setLoading(false);
      }
    };

    fetchMessages();
  }, [userId, user?.user?._id]);

  // Cập nhật socket cho messages
  useEffect(() => {
    const currentUserId = user?.user?._id;
    if (!currentUserId || !userId) return;

    // Tạo ID phòng chat duy nhất
    const room = [currentUserId, userId].sort().join("-");
    console.log(`Joining chat room: ${room}`);

    // Lắng nghe sự kiện socket
    const onNewMessage = (data) => {
      if (data && data.message) {
        const message = data.message;

        // Check if message belongs to this conversation
        if (
          (message.sender._id === userId &&
            message.receiver._id === currentUserId) ||
          (message.sender._id === currentUserId &&
            message.receiver._id === userId) ||
          (message.sender === userId && message.receiver === currentUserId) ||
          (message.sender === currentUserId && message.receiver === userId)
        ) {
          setMessages((prev) => [...prev, message]);

          // Mark as read if we're the receiver
          if (
            message.receiver === currentUserId ||
            message.receiver._id === currentUserId
          ) {
            markMessageAsRead(message._id);
          }

          // Scroll to new message
          setTimeout(scrollToBottom, 100);
        }
      }
    };

    const onUserTyping = (data) => {
      if (data.senderId === userId) {
        setIsTyping(true);
      }
    };

    const onUserStopTyping = (data) => {
      if (data.senderId === userId) {
        setIsTyping(false);
      }
    };

    const onMessageRead = (data) => {
      // Update read status for messages
      if (data && data.messageIds) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            data.messageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
          )
        );
      }
    };

    // Connect socket events
    if (socket) {
      socket.emit("join_room", room);
      socket.on("new_message", onNewMessage);
      socket.on("user_typing", onUserTyping);
      socket.on("user_stop_typing", onUserStopTyping);
      socket.on("message_read", onMessageRead);
    }

    // Cleanup
    return () => {
      if (socket) {
        socket.off("new_message", onNewMessage);
        socket.off("user_typing", onUserTyping);
        socket.off("user_stop_typing", onUserStopTyping);
        socket.off("message_read", onMessageRead);
        socket.emit("leave_room", room);
      }
    };
  }, [userId, user?.user?._id]);

  // Mark messages as read
  const markMessageAsRead = async (messageId) => {
    if (!messageId) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/messages/read/${messageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to mark message as read");
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  // Handle typing events
  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    const currentUserId = user?.user?._id;

    // Emit typing event if input is not empty
    if (socket && !isTyping && e.target.value.trim() && currentUserId) {
      socket.emit("typing", {
        senderId: currentUserId,
        receiverId: userId,
      });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set stop typing timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (
        socket &&
        (!e.target.value.trim() || !e.target.value) &&
        currentUserId
      ) {
        socket.emit("stop_typing", {
          senderId: currentUserId,
          receiverId: userId,
        });
      }
    }, 1000);
  };

  // Scroll to bottom when messages load or update
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      scrollToBottom();
    }
  }, [messages, loading]);

  // Send message function
  const sendMessage = async () => {
    const currentUserId = user?.user?._id;
    if (
      (!messageText.trim() && !imageFile) ||
      !userId ||
      !currentUserId ||
      sendingMessage
    )
      return;

    try {
      setSendingMessage(true);

      let media = null;

      // If there's an image to upload
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        // Upload image
        const uploadResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        const uploadData = await uploadResponse.json();
        media = uploadData.imageUrl;
      }

      // Send message
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/messages/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            receiverId: userId,
            content: messageText.trim(),
            media,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      if (data.code === 1) {
        setMessages((prev) => [...prev, data.data]);
        setMessageText("");
        setImageFile(null);
        setPreviewImage(null);
        scrollToBottom();

        // Stop typing signal
        if (socket) {
          socket.emit("stop_typing", {
            senderId: currentUserId,
            receiverId: userId,
          });
        }
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported");
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Cancel image upload
  const cancelImageUpload = () => {
    setImageFile(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle sending with Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Add emoji to message
  const handleEmojiSelect = (emojiData) => {
    setMessageText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Quick replies like heart or thumbs up
  const sendQuickReply = (emoji) => {
    setMessageText(emoji);
    setTimeout(sendMessage, 0);
  };

  // Format time
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Check if we should show the date separator
  const shouldShowDate = (message, index) => {
    if (index === 0) return true;

    const currentDate = new Date(message.createdAt).toLocaleDateString();
    const prevDate = new Date(
      messages[index - 1].createdAt
    ).toLocaleDateString();

    return currentDate !== prevDate;
  };

  // Format date for separator
  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  // Go back to messages list
  const goBack = () => {
    console.log("Navigating back to messages list");
    navigate("/messages");
  };

  // Log các giá trị quan trọng trước khi render
  useEffect(() => {
    // Kiểm tra cấu trúc của user từ Redux store
    console.log("Redux auth user structure:", user);
    console.log("Current user ID should be:", user?.user?._id);

    console.log("MessageDetail state:", {
      loading,
      loadingError,
      receiverUser,
      messagesCount: messages.length,
    });
  }, [loading, loadingError, receiverUser, messages, user]);

  // Thêm một hàm mới để thử lại tải tin nhắn
  const retryFetchMessages = () => {
    console.log("Retrying to fetch messages...");
    setLoading(true);
    setLoadingError(null);

    // Tải lại tin nhắn sau 300ms để tránh quá nhiều request
    setTimeout(() => {
      const fetchMessagesRetry = async () => {
        const currentUserId = user?.user?._id;
        if (!userId || !currentUserId) return;

        try {
          const url = `${
            import.meta.env.VITE_API_BASE_URL
          }/api/messages/${userId}`;
          console.log("Retrying fetch from URL:", url);

          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });

          if (!response.ok) {
            throw new Error(
              `Failed to fetch messages: ${response.status} ${response.statusText}`
            );
          }

          const data = await response.json();
          console.log("Retry API response:", data);

          if (data.code === 1) {
            console.log(
              `Successfully loaded ${data.data.length} messages on retry`
            );
            setMessages(data.data);

            if (data.data.length > 0) {
              setTimeout(scrollToBottom, 100);
            }

            setLoadingError(null);
          } else {
            console.error("API returned error on retry:", data.message);
            setLoadingError(data.message || "Failed to load messages");
          }
        } catch (error) {
          console.error("Error retrying fetch:", error);
          setLoadingError(error.message || "Failed to load messages");
        } finally {
          setLoading(false);
        }
      };

      fetchMessagesRetry();
    }, 300);
  };

  // If loading show spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // If error show error message with retry button
  if (loadingError) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">{loadingError}</p>
        <div className="flex space-x-3">
          <button
            onClick={goBack}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
          >
            Go Back
          </button>
          <button
            onClick={retryFetchMessages}
            className="bg-purple-500 text-white px-4 py-2 rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden">
      {/* Header - Modern look */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center">
          <button
            onClick={goBack}
            className="mr-3 p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <img
                  src={receiverUser?.avatar || "https://via.placeholder.com/40"}
                  alt={receiverUser?.username || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-800">
                {receiverUser?.username || "User"}
              </p>
              {isTyping ? (
                <p className="text-xs text-blue-500 flex items-center">
                  <span>Đang nhập</span>
                  <span className="flex ml-1">
                    <span
                      className="animate-bounce mx-0.5 w-1 h-1 bg-blue-500 rounded-full"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="animate-bounce mx-0.5 w-1 h-1 bg-blue-500 rounded-full"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="animate-bounce mx-0.5 w-1 h-1 bg-blue-500 rounded-full"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </span>
                </p>
              ) : (
                <p className="text-xs text-gray-500">Đang hoạt động</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
            <Phone size={18} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
            <Video size={18} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
            <Info size={18} />
          </button>
        </div>
      </div>

      {/* Message area - Modern UI */}
      <div
        ref={messageContainerRef}
        className="flex-1 p-4 overflow-y-auto bg-white"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(240, 240, 245, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(240, 240, 245, 0.07) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-3">
              <Send size={22} className="text-purple-500" />
            </div>
            <h3 className="text-base font-semibold mb-1 text-gray-800">
              Chưa có tin nhắn
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mb-4">
              Hãy bắt đầu cuộc trò chuyện với{" "}
              {receiverUser?.username || "người dùng này"}
            </p>
            <button
              onClick={() => {
                document.getElementById("messageInput")?.focus();
              }}
              className="bg-purple-500 text-white text-sm px-4 py-2 rounded-full hover:bg-purple-600 transition-colors"
            >
              Gửi tin nhắn đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Messages content */}
            {messages.map((message, index) => {
              // Lấy người gửi tin nhắn
              const isSentByCurrentUser =
                message.sender._id === user?.user?._id ||
                message.sender === user?.user?._id;

              // Kiểm tra xem hiển thị avatar ở mỗi tin nhắn hay không
              const showAvatar =
                !isSentByCurrentUser &&
                (index === 0 ||
                  messages[index - 1].sender._id === user?.user?._id ||
                  messages[index - 1].sender === user?.user?._id);

              // Kiểm tra tin nhắn liên tiếp từ cùng một người
              const isConsecutiveMessage =
                index > 0 &&
                ((isSentByCurrentUser &&
                  (messages[index - 1].sender._id === user?.user?._id ||
                    messages[index - 1].sender === user?.user?._id)) ||
                  (!isSentByCurrentUser &&
                    messages[index - 1].sender._id !== user?.user?._id &&
                    messages[index - 1].sender !== user?.user?._id));

              return (
                <React.Fragment key={message._id || index}>
                  {/* Phân cách ngày */}
                  {shouldShowDate(message, index) && (
                    <div className="flex justify-center my-4">
                      <div className="bg-gray-100 text-gray-600 text-xs px-4 py-1.5 rounded-full shadow-sm">
                        {formatDateSeparator(message.createdAt)}
                      </div>
                    </div>
                  )}

                  {/* Tin nhắn */}
                  <div
                    className={`flex items-end ${
                      isSentByCurrentUser ? "justify-end" : "justify-start"
                    } ${isConsecutiveMessage ? "mt-1" : "mt-3"}`}
                  >
                    {/* Avatar người gửi (chỉ hiện nếu không phải tin nhắn của người dùng hiện tại) */}
                    {!isSentByCurrentUser && (
                      <div
                        className={`flex-shrink-0 ${
                          showAvatar ? "visible" : "invisible"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                          <img
                            src={
                              receiverUser?.avatar ||
                              "https://via.placeholder.com/40"
                            }
                            alt={receiverUser?.username || "User"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Nội dung tin nhắn */}
                    <div
                      className={`max-w-[75%] px-3 py-2 text-sm shadow-sm
                        ${
                          isSentByCurrentUser
                            ? "bg-purple-500 text-white rounded-t-xl rounded-bl-xl rounded-br-md"
                            : "bg-gray-100 text-gray-800 rounded-t-xl rounded-br-xl rounded-bl-md"
                        }
                        ${
                          isConsecutiveMessage && isSentByCurrentUser
                            ? "rounded-tr-md"
                            : ""
                        }
                        ${
                          isConsecutiveMessage && !isSentByCurrentUser
                            ? "rounded-tl-md"
                            : ""
                        }
                      `}
                    >
                      {/* Hình ảnh trong tin nhắn */}
                      {message.media && (
                        <div className="mb-2 rounded-lg overflow-hidden">
                          <img
                            src={message.media}
                            alt="Media"
                            className="max-w-full rounded-lg"
                            onClick={() => window.open(message.media, "_blank")}
                          />
                        </div>
                      )}

                      {/* Nội dung tin nhắn */}
                      {message.content && (
                        <div className="break-words">{message.content}</div>
                      )}

                      {/* Thông tin thời gian và trạng thái đã đọc */}
                      <div
                        className={`text-xs mt-1 flex items-center ${
                          isSentByCurrentUser ? "justify-end" : "justify-start"
                        } ${
                          isSentByCurrentUser
                            ? "text-purple-100"
                            : "text-gray-500"
                        }`}
                      >
                        <span>{formatMessageTime(message.createdAt)}</span>
                        {isSentByCurrentUser && message.isRead && (
                          <span className="ml-1 text-blue-300">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Input area - Modern UI */}
      <div className="px-4 py-3 border-t flex flex-col">
        {/* Preview image */}
        {previewImage && (
          <div className="mb-3 relative">
            <div className="rounded-lg overflow-hidden max-h-40 inline-block">
              <img
                src={previewImage}
                alt="Preview"
                className="max-h-40 object-contain"
              />
            </div>
            <button
              onClick={cancelImageUpload}
              className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
            >
              &times;
            </button>
          </div>
        )}

        <div className="relative flex items-center">
          {/* Image upload button */}
          <label
            className="cursor-pointer p-2 text-gray-500 hover:text-purple-600 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </label>

          {/* Message input field */}
          <div className="flex-1 bg-gray-100 rounded-full border border-gray-200 focus-within:border-purple-300 focus-within:ring-1 focus-within:ring-purple-300 transition-all">
            <div className="flex w-full items-center">
              <input
                id="messageInput"
                type="text"
                placeholder={isTyping ? "Đang nhập..." : "Nhập tin nhắn..."}
                value={messageText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-1 py-2 px-4 bg-transparent outline-none text-gray-800 placeholder-gray-500 text-sm"
                disabled={sendingMessage}
              />

              {/* Emoji picker button */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-500 hover:text-yellow-500 transition-colors"
                >
                  <Smile size={20} />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-12 right-0 z-10">
                    <EmojiPicker
                      onEmojiClick={handleEmojiSelect}
                      width={300}
                      height={350}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={(!messageText.trim() && !imageFile) || sendingMessage}
            className={`ml-2 p-2 rounded-full ${
              (!messageText.trim() && !imageFile) || sendingMessage
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-purple-500 text-white hover:bg-purple-600 transition-colors"
            }`}
          >
            <Send size={18} />
          </button>
        </div>

        {/* Quick replies */}
        <div className="flex mt-2 space-x-2 justify-start">
          <button
            onClick={() => sendQuickReply("👍")}
            className="p-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            👍
          </button>
          <button
            onClick={() => sendQuickReply("❤️")}
            className="p-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            ❤️
          </button>
          <button
            onClick={() => sendQuickReply("😊")}
            className="p-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            😊
          </button>
          <button
            onClick={() => sendQuickReply("🙏")}
            className="p-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            🙏
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default MessageDetail;
