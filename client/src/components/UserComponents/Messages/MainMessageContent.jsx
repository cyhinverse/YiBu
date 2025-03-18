/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";

const MainMessageContent = ({ messages, selectedUser }) => {
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef();
  const currentUser = useSelector((state) => state.auth.user);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Kết nối socket
    socketRef.current = io("http://localhost:9785");

    // Tham gia phòng chat
    if (selectedUser && currentUser) {
      const roomId = `chat_${currentUser._id}_${selectedUser._id}`;
      socketRef.current.emit("join_room", roomId);
    }

    // Nhận tin nhắn mới
    socketRef.current.on("receive_message", (message) => {
      messages.push(message);
    });

    // Nhận trạng thái typing
    socketRef.current.on("user_typing", () => setIsTyping(true));
    socketRef.current.on("user_stop_typing", () => setIsTyping(false));

    return () => {
      socketRef.current.disconnect();
    };
  }, [selectedUser, currentUser, messages]);

  // Fetch tin nhắn cũ
  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    }
  }, [selectedUser]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/user/${selectedUser._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      messages.push(...data.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = () => {
    if (selectedUser) {
      const roomId = `chat_${currentUser._id}_${selectedUser._id}`;
      socketRef.current.emit("typing", { roomId });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("stop_typing", { roomId });
      }, 1000);
    }
  };

  if (!selectedUser) return null;

  return (
    <div className="w-full h-[600px] bg-white rounded-xl shadow-md border border-gray-300 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {messages.map((msg) => (
        <div
          key={msg._id}
          className={`flex items-end mb-4 ${
            msg.sender._id === currentUser._id ? "justify-end" : "justify-start"
          }`}
        >
          {msg.sender._id !== currentUser._id && (
            <img
              src={msg.sender.avatar || "https://via.placeholder.com/40"}
              alt="avatar"
              className="w-10 h-10 rounded-full mr-3"
            />
          )}
          <div
            className={`max-w-[60%] p-3 rounded-2xl relative ${
              msg.sender._id === currentUser._id
                ? "bg-blue-500 text-white rounded-br-none"
                : "bg-gray-200 text-black rounded-bl-none"
            }`}
          >
            <p>{msg.content}</p>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </div>
          </div>
          {msg.sender._id === currentUser._id && (
            <img
              src={currentUser.avatar || "https://via.placeholder.com/40"}
              alt="avatar"
              className="w-10 h-10 rounded-full ml-3"
            />
          )}
        </div>
      ))}
      {isTyping && (
        <div className="text-gray-500 italic">
          {selectedUser.username} is typing...
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MainMessageContent;
