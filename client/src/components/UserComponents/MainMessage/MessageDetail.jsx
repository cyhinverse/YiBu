import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { messageManager } from "../../../socket/messageManager";
import { toast } from "react-hot-toast";
import MessageHeader from "./components/MessageHeader";
import MessageList from "./components/MessageList";
import MessageInputArea from "./components/MessageInputArea";
import DeleteMessageModal from "./components/DeleteMessageModal";

const useUniqueMessages = () => {
  const [messages, setMessagesInternal] = useState([]);
  const messageIdsSet = useRef(new Set());

  const addMessages = useCallback((newMessagesToAdd) => {
    const messagesToAdd = Array.isArray(newMessagesToAdd)
      ? newMessagesToAdd
      : [newMessagesToAdd];

    const uniqueNewMessages = messagesToAdd.filter((msg) => {
      if (!msg || !msg._id) return false;
      if (messageIdsSet.current.has(msg._id)) return false; // Đã tồn tại

      messageIdsSet.current.add(msg._id);
      return true;
    });

    if (uniqueNewMessages.length > 0) {
      console.log(`Adding ${uniqueNewMessages.length} new unique messages`);
      setMessagesInternal((prev) => [...prev, ...uniqueNewMessages]);
    } else if (messagesToAdd.length > 0) {
      console.log(`Skipped ${messagesToAdd.length} duplicate messages`);
    }
  }, []);

  const setMessages = useCallback((newMessages) => {
    messageIdsSet.current = new Set();

    if (!Array.isArray(newMessages)) {
      console.error("setMessages received non-array value:", newMessages);
      return;
    }

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

  return { messages, addMessages, setMessages };
};

const MessageDetail = React.memo(() => {
  const { userId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();

  const selectedUserFromNav = location.state?.selectedUser;
  console.log("selectedUserFromNav:", selectedUserFromNav);

  const isInitialLoad = location.state?.isInitialLoad === true;
  console.log("isInitialLoad:", isInitialLoad);

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
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const PAGE_SIZE = 10;

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  // const typingTimeoutRef = useRef(null);
  const messageContainerRef = useRef(null);
  // const processedMessageIdsRef = useRef(new Set());
  const initialLoadCompleteRef = useRef(false);
  const setInitialLoadComplete = useCallback((value) => {
    initialLoadCompleteRef.current = value;
  }, []);

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const userIdRef = useRef(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleFetchError = useCallback(
    (error) => {
      setLoadingError(error.message || "Failed to load messages");

      if (process.env.NODE_ENV !== "production") {
        console.log("In development mode - showing empty messages UI");
        setMessages([]);
      }

      setLoading(false);
    },
    [setMessages]
  );

  const validateToken = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      navigate("/auth/login");
      return false;
    }
    return token;
  }, [navigate]);

  const refreshToken = useCallback(async () => {
    try {
      const refreshTokenValue = localStorage.getItem("refreshToken");
      if (!refreshTokenValue) {
        throw new Error("No refresh token available");
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
    } catch (error) {
      console.error("Error refreshing token:", error);
      localStorage.removeItem("accessToken");
      throw error;
    }
  }, []);

  const fetchFromApi = useCallback(
    async (
      updateLoadingState = true,
      pageNumber = 1,
      returnMessages = false
    ) => {
      try {
        if (!import.meta.env.VITE_API_BASE_URL) {
          throw new Error("API URL not configured. Please check .env file");
        }

        const currentUserId = userIdRef.current;
        if (!currentUserId) {
          throw new Error("No user ID available");
        }

        const url = `${
          import.meta.env.VITE_API_BASE_URL
        }/api/messages/${currentUserId}?page=${pageNumber}&limit=${PAGE_SIZE}`;

        try {
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

            if (response.status === 401) {
              try {
                const errorObj = JSON.parse(errorText);
                if (errorObj.error === "jwt expired") {
                  console.log("Token expired, attempting to refresh...");

                  try {
                    await refreshToken();
                    return fetchFromApi(
                      updateLoadingState,
                      pageNumber,
                      returnMessages
                    );
                  } catch (refreshError) {
                    console.error("Could not refresh token:", refreshError);
                    toast.error(
                      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                    );
                    navigate("/auth/login");
                    throw new Error("Session expired. Please login again.");
                  }
                }
              } catch (_error) {
                console.error("Error parsing error response:", _error);
              }
            }

            throw new Error(
              `Failed to fetch messages: ${response.status} ${response.statusText}. Details: ${errorText}`
            );
          }

          const data = await response.json();

          if (data.code === 1) {
            const messageData = data.data || [];

            if (messageData.length > 0 && pageNumber === 1) {
              const cacheKey = `messages_${currentUserId}`;
              sessionStorage.setItem(cacheKey, JSON.stringify(messageData));
            }

            if (messageData.length > 0) {
              if (pageNumber === 1) {
                setMessages(messageData);
                setInitialLoadComplete(true);

                if (updateLoadingState) {
                  setTimeout(() => scrollToBottom("auto"), 100);
                }
              } else {
                setMessages((prevMessages) => {
                  const existingMessageIds = new Set(
                    prevMessages.map((msg) => msg._id)
                  );

                  const uniqueNewMessages = messageData.filter(
                    (message) => !existingMessageIds.has(message._id)
                  );

                  return [...uniqueNewMessages, ...prevMessages];
                });
              }
            }

            if (returnMessages) {
              return messageData;
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
            if (returnMessages) {
              return [];
            }
          }
        } catch (fetchError) {
          console.error("Fetch error:", fetchError);
          throw fetchError;
        }
      } catch (apiError) {
        console.error("Error fetching messages from API:", apiError);
        if (updateLoadingState) {
          handleFetchError(apiError);
        }
        if (returnMessages) {
          return [];
        }
      } finally {
        if (updateLoadingState) {
          setLoading(false);
        }
      }
    },
    [navigate, refreshToken, handleFetchError, scrollToBottom, setMessages]
  );

  const fetchMessages = useCallback(async () => {
    if (!userId) return;

    const token = validateToken();
    if (!token) return;

    try {
      setLoading(true);
      setLoadingError(null);

      await fetchFromApi(true, page);

      if (messagesRef.current.length === 0) {
        const cacheKey = `messages_${userId}`;
        const cachedMessages = sessionStorage.getItem(cacheKey);
        if (cachedMessages) {
          try {
            const parsedMessages = JSON.parse(cachedMessages);
            setMessages(parsedMessages);
          } catch (_error) {
            console.error("Error parsing cached messages:", _error);
          }
        }
      }
    } catch (fetchError) {
      console.error("Error in fetchMessages:", fetchError);
      handleFetchError(fetchError);
    }
  }, [
    userId,
    page,
    validateToken,
    fetchFromApi,
    setMessages,
    handleFetchError,
  ]);

  const loadOlderMessages = useCallback(async () => {
    if (!hasMoreMessages || !userId) return [];

    try {
      const nextPage = page + 1;
      const oldMessages = await fetchFromApi(false, nextPage, true);

      if (
        !oldMessages ||
        oldMessages.length === 0 ||
        oldMessages.length < PAGE_SIZE
      ) {
        setHasMoreMessages(false);
      }

      if (oldMessages && oldMessages.length > 0) {
        setPage(nextPage);
      }

      return oldMessages;
    } catch (error) {
      console.error("Error loading older messages:", error);
      return [];
    }
  }, [userId, page, hasMoreMessages, fetchFromApi]);

  const retryFetchMessages = useCallback(() => {
    const token = validateToken();
    if (!token) return;

    refreshToken()
      .then(() => {
        setLoading(true);
        setLoadingError(null);
        setTimeout(() => fetchMessages(), 500);
      })
      .catch(() => {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate("/auth/login");
      });
  }, [validateToken, refreshToken, fetchMessages, navigate]);

  useEffect(() => {
    if (user?._id && userId === user._id) {
      console.log("Preventing self-messaging");
      toast.error("Không thể nhắn tin cho chính mình");
      navigate("/messages");
    }
  }, [user, userId, navigate]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!userId) {
        return;
      }

      if (selectedUserFromNav) {
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

        if (!response.ok) {
          throw new Error(
            `Failed to fetch user: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data.code === 1 && data.data) {
          setReceiverUser(data.data);
        } else {
          console.error("API returned error for user:", data.message);
          setLoadingError(data.message || "Failed to load user information");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setLoadingError(error.message || "Error loading user information");

        if (process.env.NODE_ENV !== "production") {
          setReceiverUser({
            _id: userId,
            username: "Test User",
            avatar: "https://via.placeholder.com/40",
          });
          setLoadingError(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [userId, selectedUserFromNav]);

  useEffect(() => {
    const checkAuthAndData = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        navigate("/auth/login");
        return;
      }

      if (!user || !user._id) {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log("Found user data in local storage:", parsedUser._id);

            if (!window.reduxUserRestored) {
              window.reduxUserRestored = true;
              window.location.reload();
            }
          } catch (_error) {
            console.error("Error parsing stored user data:", _error);
            toast.error("Có lỗi xảy ra, vui lòng đăng nhập lại");
            navigate("/auth/login");
          }
        } else {
          toast.error("Phiên đăng nhập đã hết hạn");
          navigate("/auth/login");
        }
      } else {
        console.log("User data verified in Redux store:", user._id);
      }
    };

    checkAuthAndData();
  }, [user, navigate]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    setPage(1);
    setHasMoreMessages(true);
    setMessages([]);

    fetchMessages();

    const refreshInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchFromApi(false, 1);
      }
    }, 30000);

    return () => {
      clearInterval(refreshInterval);

      if (messagesRef.current.length > 0) {
        const cacheKey = `messages_${userId}`;
        sessionStorage.setItem(cacheKey, JSON.stringify(messagesRef.current));
      }
    };
  }, [userId, isInitialLoad, fetchFromApi, setMessages]);

  const isSenderCurrentUser = (message) => {
    if (!message || !user) return false;

    if (!message.sender) {
      console.warn("Message missing sender field:", message);
      return false;
    }

    if (
      typeof message.sender === "object" &&
      message.sender &&
      message.sender._id
    ) {
      return message.sender._id === user._id;
    }

    if (typeof message.sender === "string") {
      return message.sender === user._id;
    }

    console.warn("Unhandled sender format in message:", message);
    return false;
  };

  useEffect(() => {
    if (!selectedUserFromNav && userId) {
      try {
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

  const handleDeleteMessage = (message) => {
    setMessageToDelete(message);
    setShowDeleteModal(true);
    setShowMessageOptions(null);
  };

  const [forceUpdate, setForceUpdate] = useState(0);

  const confirmDeleteMessage = useCallback(async () => {
    if (!messageToDelete || !messageToDelete._id) {
      toast.error("Không thể xóa tin nhắn. Thiếu thông tin tin nhắn.");
      setShowDeleteModal(false);
      setMessageToDelete(null);
      return;
    }

    const messageId = messageToDelete._id;
    const currentMessages = [...messages];

    try {
      setShowDeleteModal(false);

      if (!isSenderCurrentUser(messageToDelete)) {
        toast.error("Bạn chỉ có thể xóa tin nhắn của chính mình");
        setMessageToDelete(null);
        return;
      }

      const token = validateToken();
      if (!token) return;

      messagesRef.current = messagesRef.current.filter(
        (msg) => msg._id !== messageId
      );

      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );

      setForceUpdate((prev) => prev + 1);

      if (userId) {
        const updatedMessages = messages.filter((msg) => msg._id !== messageId);
        sessionStorage.setItem(
          `messages_${userId}`,
          JSON.stringify(updatedMessages)
        );
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        messagesRef.current = [...currentMessages];
        setMessages(currentMessages);
        setForceUpdate((prev) => prev + 1);
        throw new Error(
          `Failed to delete message: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.code === 1) {
        if (user && user._id) {
          messageManager.deleteMessage({
            messageId: messageId,
            senderId: user._id,
            receiverId: userId,
          });
        }

        toast.success("Đã xóa tin nhắn");

        setTimeout(() => {
          fetchFromApi(false, 1).catch((err) =>
            console.error("Error refreshing messages after deletion:", err)
          );
        }, 300);
      } else {
        messagesRef.current = [...currentMessages];
        setMessages(currentMessages);
        setForceUpdate((prev) => prev + 1);
        throw new Error(data.message || "Không thể xóa tin nhắn");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Có lỗi xảy ra khi xóa tin nhắn");

      messagesRef.current = [...currentMessages];
      setMessages(currentMessages);
      setForceUpdate((prev) => prev + 1);
    } finally {
      setMessageToDelete(null);
    }
  }, [
    messageToDelete,
    messages,
    userId,
    user,
    isSenderCurrentUser,
    validateToken,
    setMessages,
    fetchFromApi,
  ]);

  useEffect(() => {
    console.log("useEffect cleanup running, leaving MessageDetail component");
  }, []);

  return (
    <div className="h-full flex flex-col justify-around bg-white rounded-tr-2xl rounded-br-2xl overflow-hidden border-b border-gray-300">
      <MessageHeader
        receiverUser={receiverUser}
        goBack={() => navigate("/messages")}
      />

      <div
        ref={messageContainerRef}
        className="flex-1 p-5 overflow-y-auto scrollbar-hide bg-white"
      >
        <MessageList
          loading={loading}
          loadingError={loadingError}
          retryFetchMessages={retryFetchMessages}
          messages={messages}
          receiverUser={receiverUser}
          isSenderCurrentUser={isSenderCurrentUser}
          messagesEndRef={messagesEndRef}
          showMessageOptions={showMessageOptions}
          setShowMessageOptions={setShowMessageOptions}
          handleDeleteMessage={handleDeleteMessage}
          loadOlderMessages={loadOlderMessages}
        />
      </div>

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

      <MessageInputArea
        messageText={messageText}
        handleInputChange={(e) => setMessageText(e.target.value)}
        sendMessage={async () => {
          if (!messageText.trim() && !imageFile) return;
          if (!userId) {
            toast.error("Không thể gửi tin nhắn. Thiếu thông tin người nhận.");
            return;
          }
          if (userId === user?._id) {
            toast.error("Không thể gửi tin nhắn cho chính mình");
            return;
          }

          const token = localStorage.getItem("accessToken");
          if (!token) {
            toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            navigate("/auth/login");
            return;
          }

          try {
            setSendingMessage(true);

            const messageData = {
              receiverId: userId,
              senderId: user?._id || null,
              content: messageText.trim(),
            };

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

            setMessageText("");
            setImageFile(null);
            setPreviewImage(null);
            setShowEmojiPicker(false);

            if (user && user._id) {
              messageManager.sendStopTyping({
                senderId: user._id,
                receiverId: userId,
                isTyping: false,
              });
            }

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
              const newMessage = data.data;
              addMessages(newMessage);

              if (user && user._id) {
                messageManager.sendMessage({
                  message: newMessage,
                  receiverId: userId,
                  senderId: user._id,
                });
              }

              setInitialLoadComplete(true);
              setTimeout(() => scrollToBottom(), 100);

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
        }}
        handleKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            (async () => {
              if (!messageText.trim() && !imageFile) return;
              if (!userId) {
                toast.error(
                  "Không thể gửi tin nhắn. Thiếu thông tin người nhận."
                );
                return;
              }
              if (userId === user?._id) {
                toast.error("Không thể gửi tin nhắn cho chính mình");
                return;
              }

              const token = localStorage.getItem("accessToken");
              if (!token) {
                toast.error(
                  "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                );
                navigate("/auth/login");
                return;
              }

              try {
                setSendingMessage(true);

                const messageData = {
                  receiverId: userId,
                  senderId: user?._id || null,
                  content: messageText.trim(),
                };

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

                setMessageText("");
                setImageFile(null);
                setPreviewImage(null);
                setShowEmojiPicker(false);

                if (user && user._id) {
                  messageManager.sendStopTyping({
                    senderId: user._id,
                    receiverId: userId,
                    isTyping: false,
                  });
                }

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
                  const newMessage = data.data;
                  addMessages(newMessage);

                  if (user && user._id) {
                    messageManager.sendMessage({
                      message: newMessage,
                      receiverId: userId,
                      senderId: user._id,
                    });
                  }

                  setInitialLoadComplete(true);
                  setTimeout(() => scrollToBottom(), 100);

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
            })();
          }
        }}
        sendingMessage={sendingMessage}
        previewImage={previewImage}
        cancelImageUpload={() => {
          setImageFile(null);
          setPreviewImage(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
        fileInputRef={fileInputRef}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={(value) => setShowEmojiPicker(value)}
        handleEmojiSelect={(emojiData) => {
          setMessageText((prev) => prev + emojiData.emoji);
          setShowEmojiPicker(false);
        }}
        sendQuickReply={(emoji) => {
          setMessageText(emoji);
          setTimeout(() => fetchMessages(), 0);
        }}
      />

      <DeleteMessageModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMessageToDelete(null);
        }}
        onConfirm={confirmDeleteMessage}
      />
    </div>
  );
});

export default MessageDetail;
