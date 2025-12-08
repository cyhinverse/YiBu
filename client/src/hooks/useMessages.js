import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSocketContext } from "../contexts/SocketContext";

const PAGE_SIZE = 10;
const API_URL = import.meta.env.VITE_API_BASE_URL;

export const useMessages = (currentUserId, receiverId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesRef = useRef([]); // To access state in listeners
  
  // --- socket context ---
  const { socket, isConnected, joinRoom, leaveRoom } = useSocketContext();

  // Keep ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const validateToken = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Session expired. Please login again.");
      return null;
    }
    return token;
  }, []);

  // --- Fetching Logic ---
  const fetchMessages = useCallback(async (pageNum = 1, isLoadMore = false) => {
    if (!currentUserId || !receiverId) return;
    
    const token = validateToken();
    if (!token) return;

    try {
      if (!isLoadMore) setLoading(true);
      
      const response = await fetch(
        `${API_URL}/api/messages/${receiverId}?page=${pageNum}&limit=${PAGE_SIZE}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error("Failed to fetch messages");

      const data = await response.json();
      if (data.code === 1) {
        const newMsgs = data.data || [];
        
        if (newMsgs.length < PAGE_SIZE) setHasMore(false);

        setMessages(prev => {
          if (!isLoadMore) return newMsgs;
          // Deduplicate based on _id
          const existingIds = new Set(prev.map(m => m._id));
          const unique = newMsgs.filter(m => !existingIds.has(m._id));
          return [...unique, ...prev];
        });

        if (!isLoadMore) {
          setTimeout(() => scrollToBottom("auto"), 100);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      if (!isLoadMore) setLoading(false);
    }
  }, [currentUserId, receiverId, validateToken, scrollToBottom]);

  const loadMore = useCallback(async () => {
    if (!hasMore) return;
    const nextPage = page + 1;
    await fetchMessages(nextPage, true);
    setPage(nextPage);
  }, [hasMore, page, fetchMessages]);

  // --- Actions ---
  const sendMessage = useCallback(async (content, imageFile) => {
    if ((!content && !imageFile) || !receiverId || !currentUserId) return;
    if (receiverId === currentUserId) {
        toast.error("Cannot send message to yourself");
        return;
    }

    const token = validateToken();
    if (!token) return;

    setSending(true);
    try {
      let mediaUrl = null;
      
      // Upload Image if exists
      if (imageFile) {
        const formData = new FormData();
        formData.append("media", imageFile);
        const uploadRes = await fetch(`${API_URL}/api/messages/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.code === 1) mediaUrl = uploadData.data.mediaUrl;
      }

      // Send Message
      const messageData = {
        receiverId,
        senderId: currentUserId,
        content: content?.trim(),
        media: mediaUrl
      };

      const res = await fetch(`${API_URL}/api/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(messageData)
      });

      const data = await res.json();
      if (data.code === 1) {
        const newMessage = data.data;
        setMessages(prev => [...prev, newMessage]);
        setTimeout(() => scrollToBottom(), 100);

        // Emit Socket
        if (socket) {
             socket.emit("send_message", {
               message: newMessage,
               receiverId,
               senderId: currentUserId
             });
        }
        
        return true; // Success
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
    return false;
  }, [currentUserId, receiverId, validateToken, scrollToBottom, socket]);

  const deleteMessage = useCallback(async (messageId) => {
    const token = validateToken();
    if (!token) return;

    try {
      // Optimistic upate
      const previousMessages = messages;
      setMessages(prev => prev.filter(m => m._id !== messageId));

      const res = await fetch(`${API_URL}/api/messages/${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        setMessages(previousMessages); // Revert
        throw new Error("Failed to delete");
      }

      // Socket notify
      if (socket) {
          // Assuming event name is delete_message
          socket.emit("delete_message", {
             messageId,
             senderId: currentUserId,
             receiverId
          });
      }
       
       toast.success("Message deleted");
    } catch (err) {
      console.error(err);
      toast.error("Could not delete message");
    }
  }, [currentUserId, receiverId, messages, validateToken, socket]);

   const markRead = useCallback(async (messageIds) => {
    if (!messageIds?.length) return;
    const token = validateToken();
    if (!token) return;

    // Optimistic
    setMessages(prev => prev.map(m => messageIds.includes(m._id) ? {...m, isRead: true} : m));

    try {
        await fetch(`${API_URL}/api/messages/read`, {
             method: "PUT",
             headers: {
                 "Content-Type": "application/json",
                 Authorization: `Bearer ${token}` 
             },
             body: JSON.stringify({ messageIds })
        });
        
        if (socket) {
            // Using message_read to be consistent with listener
            socket.emit("message_read", {
                messageIds,
                senderId: receiverId, 
                receiverId: currentUserId 
            });
        }
    } catch(err) {
        console.error("Mark read error", err);
    }
  }, [currentUserId, receiverId, validateToken, socket]);

  // --- Real-time Updates ---
  useEffect(() => {
    if (!socket || !receiverId) return;
    
    const handleNewMessage = (data) => {
        const msg = data.message || data;
        if (!msg._id) return;
        
        // Check if relevant to this chat
        const isRelevant = (msg.sender?._id === receiverId && msg.receiver?._id === currentUserId) || 
                           (msg.sender?._id === currentUserId && msg.receiver?._id === receiverId);
                           
        if (isRelevant) {
             setMessages(prev => {
                 if (prev.find(m => m._id === msg._id)) return prev;
                 return [...prev, msg];
             });
             if (msg.sender?._id === receiverId && !msg.isRead) {
                 markRead([msg._id]);
             }
             setTimeout(() => scrollToBottom(), 100);
        }
    };
    
    socket.on("new_message", handleNewMessage);
    
    // Join room for this specific pair
    const pairRoomId = [currentUserId, receiverId].sort().join("-");
    joinRoom(pairRoomId);

    return () => {
        socket.off("new_message", handleNewMessage);
        leaveRoom(pairRoomId);
    };
  }, [socket, receiverId, currentUserId, scrollToBottom, markRead, joinRoom, leaveRoom]);

  // Initial load
  useEffect(() => {
      setPage(1);
      setMessages([]);
      fetchMessages(1, false);
  }, [receiverId]); // fetch when receiver changes

  return {
    messages,
    loading,
    error,
    sending,
    hasMore,
    messagesEndRef,
    loadMore,
    sendMessage,
    deleteMessage,
    refresh: () => fetchMessages(1, false)
  };
};
