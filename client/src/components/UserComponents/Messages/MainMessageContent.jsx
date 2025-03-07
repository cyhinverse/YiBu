/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";

const fakeMessages = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  sender: i % 2 === 0 ? "me" : "other",
  avatar: `https://i.pravatar.cc/40?img=${(i % 10) + 1}`,
  content: `Đây là tin nhắn số ${i + 1}`,
  time: `${10 + Math.floor(i / 2)}:${(i * 2) % 60} AM`,
  liked: Math.random() > 0.7,
}));

const MainMessageContent = () => {
  const [messages, setMessages] = useState(fakeMessages);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-full h-[600px] bg-white rounded-xl shadow-md border border-gray-300 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-end mb-4 ${
            msg.sender === "me" ? "justify-end" : "justify-start"
          }`}
        >
          {msg.sender === "other" && (
            <img
              src={msg.avatar}
              alt="avatar"
              className="w-10 h-10 rounded-full mr-3"
            />
          )}
          <div
            className={`max-w-[60%] p-3 rounded-2xl relative ${
              msg.sender === "me"
                ? "bg-blue-500 text-white rounded-br-none"
                : "bg-gray-200 text-black rounded-bl-none"
            }`}
          >
            <p>{msg.content}</p>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>{msg.time}</span>
              <button className="ml-2">{msg.liked ? "❤️" : "🤍"}</button>
            </div>
          </div>
          {msg.sender === "me" && (
            <img
              src={msg.avatar}
              alt="avatar"
              className="w-10 h-10 rounded-full ml-3"
            />
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MainMessageContent;
