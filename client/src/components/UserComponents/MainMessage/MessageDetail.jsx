import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Send,
  ArrowLeft,
  Image,
  Smile,
  Phone,
  Video,
  Info,
} from "lucide-react";
import { socket } from "../../../socket";
import { toast } from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

// Custom hook để quản lý tin nhắn và đảm bảo không có trùng lặp
const useUniqueMessages = () => {
  const [messages, setMessagesInternal] = useState([]);
  const messageIdsSet = useRef(new Set());

  // Hàm thêm tin nhắn an toàn - không trùng lặp
  const addMessages = useCallback((newMessagesToAdd) => {
    // Chuyển đổi thành mảng nếu chỉ truyền vào một tin nhắn
    const messagesToAdd = Array.isArray(newMessagesToAdd)
      ? newMessagesToAdd
      : [newMessagesToAdd];

    // Lọc ra các tin nhắn chưa có trong state
    const uniqueNewMessages = messagesToAdd.filter((msg) => {
      if (!msg || !msg._id) return false; // Bỏ qua tin nhắn không có ID
      if (messageIdsSet.current.has(msg._id)) return false; // Đã tồn tại

      // Thêm ID vào set
      messageIdsSet.current.add(msg._id);
      return true; // Đây là tin nhắn mới
    });

    if (uniqueNewMessages.length > 0) {
      console.log(`Adding ${uniqueNewMessages.length} new unique messages`);
      setMessagesInternal((prev) => [...prev, ...uniqueNewMessages]);
    } else if (messagesToAdd.length > 0) {
      console.log(`Skipped ${messagesToAdd.length} duplicate messages`);
    }
  }, []);

  // Hàm set messages mới hoàn toàn
  const setMessages = useCallback((newMessages) => {
    // Đặt lại Set ID khi set mới hoàn toàn
    messageIdsSet.current = new Set();

    // Loại bỏ trùng lặp trong mảng mới
    const uniqueMessages = [];
    newMessages.forEach((msg) => {
      if (msg && msg._id && !messageIdsSet.current.has(msg._id)) {
        messageIdsSet.current.add(msg._id);
        uniqueMessages.push(msg);
      }
    });

    console.log(
      `Setting ${uniqueMessages.length} unique messages from ${newMessages.length} total messages`
    );
    setMessagesInternal(uniqueMessages);
  }, []);

  // Nếu component re-render mà không thay đổi tin nhắn, chúng ta muốn giữ nguyên tham chiếu
  return { messages, addMessages, setMessages };
};

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

  // Sử dụng custom hook thay cho useState trực tiếp
  const { messages, addMessages, setMessages } = useUniqueMessages();

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
  const processedMessageIdsRef = useRef(new Set());

  // Thêm ref để theo dõi danh sách tin nhắn trước đó
  const previousMessagesRef = useRef([]);

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
        setLoading(false);
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

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          throw new Error(
            `Failed to fetch messages: ${response.status} ${response.statusText}. Details: ${errorText}`
          );
        }

        const data = await response.json();

        if (data.code === 1) {
          const messageCount = data.data ? data.data.length : 0;
          console.log(`Successfully loaded ${messageCount} messages`);

          // Nếu đã có tin nhắn trong state, tránh trùng lặp khi tải thêm
          if (messages.length > 0) {
            // Lọc để chỉ thêm tin nhắn chưa có trong state
            const existingMessageIds = new Set(messages.map((msg) => msg._id));
            const newMessages = data.data.filter(
              (msg) => !existingMessageIds.has(msg._id)
            );

            console.log(
              `Found ${newMessages.length} new messages to add to existing ${messages.length}`
            );

            // Chỉ cập nhật nếu có tin nhắn mới
            if (newMessages.length > 0) {
              setMessages((prev) => [...prev, ...newMessages]);
            }
          } else {
            // Nếu chưa có tin nhắn nào, đặt tất cả
            setMessages(data.data || []);
          }

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
        setLoadingError(error.message || "Failed to load messages");

        if (process.env.NODE_ENV !== "production") {
          console.log("In development mode - showing empty messages UI");
          setMessages([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [userId, user?.user?._id]);

  // Cập nhật danh sách ID tin nhắn đã xử lý
  useEffect(() => {
    if (messages.length > 0) {
      // Cập nhật Set trong ref với ID tin nhắn hiện tại
      processedMessageIdsRef.current = new Set(
        messages.map((msg) => msg._id).filter(Boolean)
      );
      console.log(
        `Updated tracking of ${processedMessageIdsRef.current.size} message IDs to prevent duplicates`
      );
    }
  }, [messages]);

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
        const messageId = message._id;

        // Kiểm tra nhanh trong ref trước
        if (messageId && processedMessageIdsRef.current.has(messageId)) {
          console.log(
            `Socket: Message ${messageId} already processed, skipping`
          );
          return;
        }

        // Check if message belongs to this conversation
        if (
          (message.sender._id === userId &&
            message.receiver._id === currentUserId) ||
          (message.sender._id === currentUserId &&
            message.receiver._id === userId) ||
          (message.sender === userId && message.receiver === currentUserId) ||
          (message.sender === currentUserId && message.receiver === userId)
        ) {
          // Kiểm tra xem tin nhắn đã tồn tại trong state chưa
          setMessages((prev) => {
            // Kiểm tra trùng lặp tin nhắn theo ID
            const isDuplicate =
              messageId && prev.some((msg) => msg._id === messageId);
            if (isDuplicate) {
              console.log("Skipping duplicate message:", messageId);
              return prev; // Không thêm tin nhắn trùng lặp
            }

            // Thêm ID vào ref để theo dõi
            if (messageId) {
              processedMessageIdsRef.current.add(messageId);
            }

            console.log("Adding new message to state:", messageId);
            return [...prev, message]; // Chỉ thêm tin nhắn mới
          });

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
        // Thêm tin nhắn vào state (chỉ khi chưa được xử lý qua socket)
        // Đánh dấu tin nhắn này đã được xử lý để tránh xử lý lại từ socket
        const messageId = data.data._id;
        if (messageId) {
          processedMessageIdsRef.current.add(messageId);
        }

        // Kiểm tra xem tin nhắn đã tồn tại trong state chưa trước khi thêm
        setMessages((prev) => {
          const isDuplicate =
            messageId && prev.some((msg) => msg._id === messageId);
          if (isDuplicate) {
            console.log(
              "Message already exists, not adding duplicate:",
              messageId
            );
            return prev;
          }
          console.log("Adding new sent message to state:", messageId);
          return [...prev, data.data];
        });

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
      messagesIds: messages.map((msg) => msg._id), // Log ID của tất cả tin nhắn để debug
    });
  }, [loading, loadingError, receiverUser, messages, user]);

  // Render message loading state or error
  const renderMessageLoadingState = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading messages...</p>
          </div>
        ) : loadingError ? (
          <div className="flex flex-col items-center text-center max-w-md mx-auto space-y-4">
            <div className="bg-red-100 rounded-full p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-red-600 font-medium">
              {loadingError || "Failed to load messages"}
            </p>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              onClick={retryFetchMessages}
            >
              Try Again
            </button>
          </div>
        ) : null}
      </div>
    );
  };

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

  // Thêm hàm loại bỏ các tin nhắn trùng lặp trong state
  const removeDuplicateMessages = (messages) => {
    // Tạo Map để theo dõi tin nhắn theo ID
    const seenMessages = new Map();

    // Chỉ giữ lại tin nhắn xuất hiện đầu tiên
    messages.forEach((message) => {
      if (message && message._id && !seenMessages.has(message._id)) {
        seenMessages.set(message._id, message);
      }
    });

    // Chuyển Map thành mảng
    return Array.from(seenMessages.values());
  };

  // Kiểm tra và loại bỏ trùng lặp khi messages thay đổi
  useEffect(() => {
    // Chỉ xử lý khi có nhiều tin nhắn và khi số lượng tin nhắn tăng lên
    // (để tránh vòng lặp vô hạn)
    if (
      messages.length > 1 &&
      messages.length > previousMessagesRef.current.length
    ) {
      // Cập nhật ref để theo dõi số lượng tin nhắn hiện tại
      previousMessagesRef.current = [...messages];

      // Lọc trùng lặp theo ID
      const dedupedMessages = Array.from(
        new Map(messages.map((message) => [message._id, message])).values()
      );

      // Chỉ cập nhật state nếu đã loại bỏ được trùng lặp
      if (dedupedMessages.length < messages.length) {
        console.log(
          `Removing ${
            messages.length - dedupedMessages.length
          } duplicate messages`
        );

        // Sử dụng setTimeout và một flag để chỉ chạy một lần
        const uniqueMessagesIds = JSON.stringify(
          dedupedMessages.map((m) => m._id)
        );
        const currentMessagesIds = JSON.stringify(messages.map((m) => m._id));

        if (uniqueMessagesIds !== currentMessagesIds) {
          // Ngừng theo dõi sự thay đổi messages tạm thời
          const timer = setTimeout(() => {
            setMessages(dedupedMessages);
          }, 50);

          return () => clearTimeout(timer);
        }
      }
    }
  }, [messages]);

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col bg-white rounded-tr-2xl rounded-br-2xl overflow-hidden border-t border-r border-b border-gray-300">
      {/* Header - simple user info */}
      <div className="px-4 py-3.5 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm flex-shrink-0">
        <div className="flex items-center">
          <button
            onClick={goBack}
            className="mr-3 p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-all duration-200 md:hidden"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center">
            <div className="relative">
              <img
                src={receiverUser?.avatar || "https://via.placeholder.com/40"}
                alt={receiverUser?.username || "User"}
                className="w-11 h-11 rounded-full object-cover border border-gray-200"
              />
              {receiverUser?.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
              )}
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">
                {receiverUser?.username || "User"}
              </p>
              <p className="text-xs text-gray-500">
                {receiverUser?.online ? "Đang hoạt động" : "Không hoạt động"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-1">
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all duration-200">
            <Phone size={18} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all duration-200">
            <Video size={18} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all duration-200">
            <Info size={18} />
          </button>
        </div>
      </div>

      {/* Message area with clean background */}
      <div
        ref={messageContainerRef}
        className="flex-1 p-5 overflow-y-auto scrollbar-hide bg-white"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <Send size={22} className="text-indigo-600" />
            </div>
            <h3 className="text-base font-semibold mb-2 text-gray-700">
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
              className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-full hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Gửi tin nhắn đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Messages content */}
            {messages.map((message, index) => {
              // Identify message sender
              const isSentByCurrentUser =
                message.sender._id === user?.user?._id ||
                message.sender === user?.user?._id;

              // Show avatar only for first message in a sequence from same user
              const showAvatar =
                !isSentByCurrentUser &&
                (index === 0 ||
                  messages[index - 1].sender._id === user?.user?._id ||
                  messages[index - 1].sender === user?.user?._id);

              // Group consecutive messages from same sender
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
                  {/* Date separator */}
                  {shouldShowDate(message, index) && (
                    <div className="flex justify-center my-4">
                      <div className="bg-gray-100 text-gray-600 text-xs px-5 py-1.5 rounded-full">
                        {formatDateSeparator(message.createdAt)}
                      </div>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`flex items-end ${
                      isSentByCurrentUser ? "justify-end" : "justify-start"
                    } ${isConsecutiveMessage ? "mt-1" : "mt-3"}`}
                  >
                    {/* Show avatar only for other user's messages */}
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

                    {/* Message bubble styling */}
                    <div
                      className={`max-w-[75%] px-3.5 py-2.5 text-sm ${
                        isSentByCurrentUser
                          ? "bg-indigo-50 text-gray-800 rounded-xl"
                          : "bg-white text-gray-800 rounded-xl shadow-sm border border-gray-100"
                      }`}
                    >
                      {/* Message media */}
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

                      {/* Message text */}
                      {message.content && (
                        <div className="break-words">{message.content}</div>
                      )}

                      {/* Time and read status */}
                      <div
                        className={`text-xs mt-1 flex items-center ${
                          isSentByCurrentUser ? "justify-end" : "justify-start"
                        } text-gray-400`}
                      >
                        <span>{formatMessageTime(message.createdAt)}</span>
                        {isSentByCurrentUser && message.isRead && (
                          <span className="ml-1 text-indigo-500">✓</span>
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

      {/* Typing indicator */}
      {isTyping && (
        <div className="px-4 py-2 bg-white border-t border-gray-50">
          <div className="flex items-center text-xs text-gray-500">
            <div className="flex space-x-1 mr-2">
              <div
                className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: "600ms" }}
              ></div>
            </div>
            <span>{receiverUser?.username || "User"} đang nhập...</span>
          </div>
        </div>
      )}

      {/* Input area - Simple minimal design */}
      <div className="px-4 py-3 border-t border-gray-100 flex flex-col bg-white flex-shrink-0">
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
              className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              &times;
            </button>
          </div>
        )}

        <div className="relative flex items-center">
          {/* Image upload button */}
          <button
            className="cursor-pointer p-2 text-gray-500 hover:text-indigo-600 transition-all duration-200"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>

          {/* Message input field */}
          <div className="flex-1 bg-gray-50 rounded-full border border-gray-200 focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-200 transition-all duration-200">
            <div className="flex w-full items-center">
              <input
                id="messageInput"
                type="text"
                placeholder="Nhập tin nhắn..."
                value={messageText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-1 py-2.5 px-4 bg-transparent outline-none text-gray-800 placeholder-gray-500 text-sm"
                disabled={sendingMessage}
              />

              {/* Emoji picker */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-500 hover:text-yellow-500 transition-all duration-200"
                >
                  <Smile size={20} />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-12 right-0 z-10 shadow-xl rounded-lg overflow-hidden">
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
            className={`ml-2 p-2.5 rounded-full ${
              (!messageText.trim() && !imageFile) || sendingMessage
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200 shadow-sm"
            }`}
          >
            <Send size={18} />
          </button>
        </div>

        {/* Quick reactions */}
        <div className="flex mt-2 space-x-2 justify-start">
          <button
            onClick={() => sendQuickReply("👍")}
            className="p-1.5 text-sm bg-white hover:bg-gray-100 rounded-full transition-all duration-200 border border-gray-200"
          >
            👍
          </button>
          <button
            onClick={() => sendQuickReply("❤️")}
            className="p-1.5 text-sm bg-white hover:bg-gray-100 rounded-full transition-all duration-200 border border-gray-200"
          >
            ❤️
          </button>
          <button
            onClick={() => sendQuickReply("😊")}
            className="p-1.5 text-sm bg-white hover:bg-gray-100 rounded-full transition-all duration-200 border border-gray-200"
          >
            😊
          </button>
          <button
            onClick={() => sendQuickReply("🙏")}
            className="p-1.5 text-sm bg-white hover:bg-gray-100 rounded-full transition-all duration-200 border border-gray-200"
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
