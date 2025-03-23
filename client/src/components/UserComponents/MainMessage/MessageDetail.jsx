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
import { messageManager } from "../../../socket/messageManager";
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
  const auth = useSelector((state) => state.auth); // Người dùng hiện tại
  const navigate = useNavigate();
  const location = useLocation();

  // Console log cho debugging
  console.log("MessageDetail rendered with userId:", userId);
  console.log("Current authenticated user:", auth);
  console.log("Location state:", location.state);

  // Nhận thông tin người dùng từ state navigation nếu có
  const selectedUserFromNav = location.state?.selectedUser;
  console.log("selectedUserFromNav:", selectedUserFromNav);

  // Đảm bảo cấu trúc user nhất quán
  const getUserData = () => {
    // Thử lấy từ state navigation trước
    const currentUserFromNav = location.state?.currentUser;
    if (currentUserFromNav && currentUserFromNav._id) {
      console.log("Using current user data from navigation state");
      return currentUserFromNav;
    }

    // Thử lấy từ Redux
    if (auth && (auth.user?._id || auth._id)) {
      console.log("Using current user data from Redux store");
      return auth.user || auth;
    }

    // Thử lấy từ localStorage
    try {
      const storedUserStr = localStorage.getItem("user");
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        console.log(
          "Using current user data from localStorage:",
          storedUser._id
        );
        return storedUser;
      }
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
    }

    // Thử lấy từ accessToken
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        console.log("Using accessToken to create fallback user object");
        // Tạo đối tượng người dùng dự phòng từ token
        // Không có _id, nhưng ít nhất chúng ta có thể tiếp tục sử dụng token
        return {
          _id: "temp_" + Math.random().toString(36).substring(2, 15),
          token: token,
          isFallbackUser: true,
        };
      }
    } catch (error) {
      console.error("Error creating fallback user:", error);
    }

    console.warn("No valid user data found!");
    return null;
  };

  const user = getUserData();

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

  // Định nghĩa các callback functions trước khi sử dụng trong useEffect
  // Xử lý khi nhận tin nhắn mới
  const onNewMessage = useCallback(
    (data) => {
      if (!data || !data.message) {
        console.log("Received empty message data");
        return;
      }

      const message = data.message;
      const messageId = message._id;

      // Kiểm tra nhanh trong ref trước
      if (messageId && processedMessageIdsRef.current.has(messageId)) {
        console.log(`Socket: Message ${messageId} already processed, skipping`);
        return;
      }

      // Thêm bảo vệ khi không có user
      if (!user || !user._id) {
        console.log("Cannot process socket message - no user data");
        return;
      }

      // Kiểm tra xem tin nhắn thuộc về cuộc trò chuyện này không
      const isSenderCurrentUser =
        message.sender._id === user._id || message.sender === user._id;
      const isReceiverCurrentUser =
        message.receiver._id === user._id || message.receiver === user._id;
      const isSenderOtherUser =
        message.sender._id === userId || message.sender === userId;
      const isReceiverOtherUser =
        message.receiver._id === userId || message.receiver === userId;

      if (
        (isSenderCurrentUser && isReceiverOtherUser) ||
        (isReceiverCurrentUser && isSenderOtherUser)
      ) {
        // Kiểm tra trùng lặp và thêm tin nhắn mới
        if (messageId) {
          processedMessageIdsRef.current.add(messageId);
        }

        console.log("Adding new message from socket to state:", messageId);
        addMessages(message);

        // Đánh dấu là đã đọc nếu chúng ta là người nhận
        if (isReceiverCurrentUser) {
          markMessageAsRead(message._id);
        }

        // Cuộn xuống tin nhắn mới
        setTimeout(scrollToBottom, 100);
      }
    },
    [userId, user, addMessages]
  );

  // Xử lý khi người dùng đang nhập
  const onUserTyping = useCallback(
    (data) => {
      if (data.senderId === userId) {
        setIsTyping(true);
      }
    },
    [userId]
  );

  // Xử lý khi người dùng dừng nhập
  const onUserStopTyping = useCallback(
    (data) => {
      if (data.senderId === userId) {
        setIsTyping(false);
      }
    },
    [userId]
  );

  // Xử lý khi tin nhắn được đánh dấu đã đọc
  const onMessageRead = useCallback(
    (data) => {
      // Cập nhật trạng thái đã đọc cho tin nhắn
      if (data && data.messageIds && data.messageIds.length > 0) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            data.messageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
          )
        );
      }
    },
    [setMessages]
  );

  // Mark messages as read
  const markMessageAsRead = async (messageId) => {
    try {
      if (!messageId || !userId || !user) return;

      // Gửi sự kiện thông qua socket ngay
      messageManager.markAsRead({
        messageIds: [messageId],
        senderId: userId,
        receiverId: user._id,
      });

      // Gửi API request
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
        console.error("Error marking message as read:", response.statusText);
        return;
      }

      // Cập nhật UI
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
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

  // Thêm đoạn useEffect để kiểm tra trạng thái đăng nhập và dữ liệu người dùng khi trang được làm mới
  useEffect(() => {
    const checkAuthAndData = async () => {
      // Kiểm tra xem có token không để xác định đã đăng nhập hay chưa
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.log("No access token found, redirecting to login");
        toast.error("Vui lòng đăng nhập để tiếp tục");
        navigate("/login");
        return;
      }

      if (!user || !user._id) {
        console.log(
          "User data missing or invalid in Redux store, trying to reload from storage"
        );
        // Kiểm tra nếu có dữ liệu người dùng trong localStorage
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          try {
            // Parse và sử dụng dữ liệu người dùng từ localStorage
            const parsedUser = JSON.parse(storedUser);
            console.log("Found user data in local storage:", parsedUser._id);

            // Tùy chọn: có thể dispatch một hành động để cập nhật Redux store
            if (!global.reduxUserRestored) {
              console.log("Restoring user data to auth state");
              global.reduxUserRestored = true;
              // Reload trang để cập nhật lại state từ localStorage
              window.location.reload();
            }
          } catch (error) {
            console.error("Error parsing stored user data:", error);
            toast.error("Có lỗi xảy ra, vui lòng đăng nhập lại");
            navigate("/login");
          }
        } else {
          // Không có dữ liệu người dùng, chuyển hướng đến trang đăng nhập
          console.log("No user data in storage, redirecting to login");
          toast.error("Phiên đăng nhập đã hết hạn");
          navigate("/login");
        }
      } else {
        console.log("User data verified in Redux store:", user._id);
      }
    };

    checkAuthAndData();
  }, [user, navigate]);

  // Sửa đổi useEffect fetchMessages để thêm logic retry và lưu cache khi cần thiết
  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId) {
        console.log("Skipping fetchMessages - no userId available");
        return;
      }

      if (!user) {
        console.log("No user data, creating token-only request");
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.log("No token available, cannot fetch messages");
          setLoadingError("Không thể tải tin nhắn. Vui lòng đăng nhập lại.");
          setLoading(false);
          return;
        }
      }

      try {
        console.log(
          "fetchMessages - Starting to fetch messages for user:",
          userId
        );
        setLoading(true);
        setLoadingError(null); // Reset error state

        // Kiểm tra cache trước
        const cacheKey = `messages_${userId}`;
        const cachedMessages = sessionStorage.getItem(cacheKey);

        if (cachedMessages) {
          try {
            const parsedMessages = JSON.parse(cachedMessages);
            console.log(
              `Restoring ${parsedMessages.length} messages from cache`
            );
            setMessages(parsedMessages);

            // Vẫn tải từ API ở nền để lấy dữ liệu mới nhất
            setTimeout(() => fetchFromApi(false), 100);
            return;
          } catch (error) {
            console.error("Error parsing cached messages:", error);
            // Tiếp tục tải từ API nếu cache bị lỗi
          }
        }

        fetchFromApi(true);
      } catch (error) {
        console.error("Error in fetchMessages:", error);
        handleFetchError(error);
      }
    };

    // Tách riêng phần tải từ API để dễ tái sử dụng
    const fetchFromApi = async (updateLoadingState = true) => {
      try {
        if (!import.meta.env.VITE_API_BASE_URL) {
          throw new Error("API URL not configured. Please check .env file");
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
        console.log("API response for messages:", data);

        if (data.code === 1) {
          const messageData = data.data || [];
          const messageCount = messageData.length;
          console.log(`Successfully loaded ${messageCount} messages`);

          // Lưu vào cache
          if (messageCount > 0) {
            const cacheKey = `messages_${userId}`;
            sessionStorage.setItem(cacheKey, JSON.stringify(messageData));
          }

          // Cập nhật state nếu data khác với cache hoặc state hiện tại
          const currentMsgIds = messages
            .map((m) => m._id)
            .sort()
            .join(",");
          const newMsgIds = messageData
            .map((m) => m._id)
            .sort()
            .join(",");

          if (currentMsgIds !== newMsgIds) {
            setMessages(messageData);
          }

          // Nếu có tin nhắn, scroll xuống dưới
          if (messageData.length > 0 && updateLoadingState) {
            setTimeout(scrollToBottom, 100);
          }
        } else {
          console.error(
            "API returned error code:",
            data.code,
            "message:",
            data.message
          );
          if (updateLoadingState) {
            setLoadingError(data.message || "Failed to load messages");
          }
        }
      } catch (error) {
        console.error("Error fetching messages from API:", error);
        if (updateLoadingState) {
          handleFetchError(error);
        }
      } finally {
        if (updateLoadingState) {
          setLoading(false);
        }
      }
    };

    const handleFetchError = (error) => {
      setLoadingError(error.message || "Failed to load messages");

      if (process.env.NODE_ENV !== "production") {
        console.log("In development mode - showing empty messages UI");
        setMessages([]);
      }

      setLoading(false);
    };

    fetchMessages();

    // Thiết lập interval để làm mới tin nhắn
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        console.log("Auto-refreshing messages");
        fetchFromApi(false);
      }
    }, 30000); // Làm mới mỗi 30 giây

    return () => {
      clearInterval(refreshInterval);

      // Lưu trạng thái tin nhắn hiện tại vào cache trước khi unmount
      if (messages.length > 0) {
        const cacheKey = `messages_${userId}`;
        sessionStorage.setItem(cacheKey, JSON.stringify(messages));
      }
    };
  }, [userId]);

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

  // Đăng ký các hàm xử lý socket
  useEffect(() => {
    if (!userId) {
      console.log("No userId available for socket setup");
      return;
    }

    // Nếu không có user, không thiết lập socket
    if (!user || !user._id) {
      console.log(
        "No valid user data for socket setup, skipping socket event listeners"
      );
      return;
    }

    console.log("Setting up socket event listeners for user:", userId);

    // Tạo chat room ID
    const chatRoomId = [user._id, userId].sort().join("-");
    console.log("Chat room ID:", chatRoomId);

    // Tham gia phòng chat
    messageManager.joinRoom(chatRoomId);

    // Tham gia phòng của người dùng - sử dụng ID người dùng làm room ID
    messageManager.joinRoom(user._id);

    // Lắng nghe tin nhắn mới
    const unsubscribeNewMessage = messageManager.onNewMessage(onNewMessage);

    // Lắng nghe trạng thái đang nhập
    const unsubscribeTyping = messageManager.onTyping(onUserTyping);

    // Lắng nghe dừng nhập
    const unsubscribeStopTyping = messageManager.onStopTyping(onUserStopTyping);

    // Lắng nghe đánh dấu đã đọc
    const unsubscribeMessageRead = messageManager.onMessageRead(onMessageRead);

    // Clean up
    return () => {
      messageManager.leaveRoom(chatRoomId);
      unsubscribeNewMessage();
      unsubscribeTyping();
      unsubscribeStopTyping();
      unsubscribeMessageRead();
    };
  }, [
    userId,
    user,
    onNewMessage,
    onUserTyping,
    onUserStopTyping,
    onMessageRead,
  ]);

  // Xử lý đăng ký đang nhập
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (messageText && userId && user) {
      // Gửi sự kiện đang nhập
      messageManager.sendTyping({
        senderId: user._id,
        receiverId: userId,
        isTyping: true,
      });

      // Thiết lập timeout để gửi sự kiện dừng nhập sau 3 giây
      typingTimeoutRef.current = setTimeout(() => {
        messageManager.sendStopTyping({
          senderId: user._id,
          receiverId: userId,
          isTyping: false,
        });
      }, 3000);
    } else if (userId && user) {
      // Nếu không nhập, gửi sự kiện dừng nhập
      messageManager.sendStopTyping({
        senderId: user._id,
        receiverId: userId,
        isTyping: false,
      });
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageText, userId, user]);

  // Xử lý thay đổi nội dung input
  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    // Các sự kiện typing được xử lý tự động trong useEffect ở trên
  };

  // Scroll to bottom when messages load or update
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      scrollToBottom();
    }
  }, [messages, loading]);

  // Gửi tin nhắn
  const sendMessage = async () => {
    if (!messageText.trim() && !imageFile) {
      return;
    }

    // Kiểm tra xem có userId hay không
    if (!userId) {
      console.error("No userId available, cannot send message");
      toast.error("Không thể gửi tin nhắn. Thiếu thông tin người nhận.");
      return;
    }

    // Kiểm tra xem có token hay không
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("No token available, cannot send message");
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    try {
      setSendingMessage(true);

      // Tạo message data
      const messageData = {
        receiverId: userId,
        // Nếu không có user._id, sử dụng null và để server xử lý
        senderId: user?._id || null,
        content: messageText.trim(),
      };

      // Xử lý tải lên hình ảnh (nếu có)
      if (imageFile) {
        const formData = new FormData();
        formData.append("media", imageFile);

        const uploadResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/messages/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        const uploadData = await uploadResponse.json();
        if (uploadData.code === 1 && uploadData.data.mediaUrl) {
          messageData.media = uploadData.data.mediaUrl;
        }
      }

      // Xóa nội dung và preview sau khi submit
      setMessageText("");
      setImageFile(null);
      setPreviewImage(null);
      setShowEmojiPicker(false);

      // Reset typing status nếu có user
      if (user && user._id) {
        messageManager.sendStopTyping({
          senderId: user._id,
          receiverId: userId,
          isTyping: false,
        });
      }

      // Gửi tin nhắn qua API
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/messages/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(messageData),
        }
      );

      const data = await response.json();

      if (data.code === 1) {
        // Thêm tin nhắn vào UI
        const newMessage = data.data;
        addMessages(newMessage);

        // Gửi thông báo qua socket nếu có user
        if (user && user._id) {
          messageManager.sendMessage({
            message: newMessage,
            receiverId: userId,
            senderId: user._id,
          });
        }

        // Đảm bảo scroll xuống dưới sau khi thêm tin nhắn
        setTimeout(scrollToBottom, 100);

        // Làm mới trang sau 2 giây nếu dùng user dự phòng
        if (user?.isFallbackUser) {
          toast.success(
            "Tin nhắn đã gửi. Đang làm mới trang để hiển thị chính xác."
          );
          setTimeout(() => window.location.reload(), 2000);
        }
      } else {
        toast.error(data.message || "Could not send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error sending message. Please try again.");
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
    if (
      !message ||
      !message.createdAt ||
      !messages[index - 1] ||
      !messages[index - 1].createdAt
    )
      return false;

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
        if (!userId || !user._id) return;

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

  // Kiểm tra xem có thông tin trong sessionStorage không
  useEffect(() => {
    if (!selectedUserFromNav && userId) {
      try {
        // Nếu không có thông tin từ state, thử lấy từ sessionStorage
        const storedUserData = sessionStorage.getItem(`selectedUser_${userId}`);
        if (storedUserData) {
          console.log("Restoring selected user data from sessionStorage");
          const parsedUserData = JSON.parse(storedUserData);
          setReceiverUser(parsedUserData);
        }
      } catch (error) {
        console.error("Error retrieving user data from sessionStorage:", error);
      }
    }
  }, [selectedUserFromNav, userId]);

  // Kiểm tra xem message có dữ liệu sender không
  const isSenderCurrentUser = (message) => {
    // Nếu không có người dùng hiện tại, không thể là người gửi
    if (!user || !user._id) return false;

    // Trường hợp sender là đối tượng
    if (message.sender && message.sender._id) {
      return message.sender._id === user._id;
    }

    // Trường hợp sender là chuỗi ID
    if (typeof message.sender === "string") {
      return message.sender === user._id;
    }

    return false;
  };

  // Kiểm tra xem message có hiển thị avatar không
  const shouldShowAvatar = (message, index, messages) => {
    // Nếu tin nhắn đầu tiên, luôn hiển thị avatar
    if (index === 0) return true;

    const currentIsSentByCurrentUser = isSenderCurrentUser(message);
    const prevIsSentByCurrentUser = isSenderCurrentUser(messages[index - 1]);

    // Chỉ hiển thị nếu tin nhắn hiện tại không phải do người dùng hiện tại gửi
    // và tin nhắn trước đó là do người dùng hiện tại gửi
    return !currentIsSentByCurrentUser && prevIsSentByCurrentUser;
  };

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
        {loading ? (
          renderMessageLoadingState()
        ) : messages.length === 0 ? (
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
            {/* Thông báo debugging chỉ hiển thị trong development */}
            {process.env.NODE_ENV !== "production" && (
              <div className="text-xs bg-yellow-50 p-2 rounded text-yellow-700 mb-2">
                Debug: Hiển thị {messages.length} tin nhắn
              </div>
            )}

            {/* Messages content */}
            {messages.map((message, index) => {
              if (!message || !message._id) return null;

              // Kiểm tra xem message có dữ liệu sender không
              const hasSender =
                message.sender &&
                (message.sender._id || typeof message.sender === "string");
              if (!hasSender) return null;

              // Sử dụng helper function để xác định người gửi
              const isSentByCurrentUser = isSenderCurrentUser(message);

              // Sử dụng helper function để xác định hiển thị avatar
              const showAvatar = shouldShowAvatar(message, index, messages);

              // Group consecutive messages from same sender
              const isConsecutiveMessage =
                index > 0 &&
                messages[index - 1] &&
                isSentByCurrentUser ===
                  isSenderCurrentUser(messages[index - 1]);

              return (
                <React.Fragment key={message._id}>
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
