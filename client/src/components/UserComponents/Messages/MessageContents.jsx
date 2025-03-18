import React, { useState, useEffect } from "react";
import HeaderMessageContent from "./HeaderMessageContent";
import MainMessageContent from "./MainMessageContent";
import FooterMessageContent from "./FooterMessageContent";
import { useSelector } from "react-redux";

const MessageContents = ({ selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    }
  }, [selectedUser]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/user/${selectedUser._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (content) => {
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver: selectedUser._id,
          content,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 flex-1">
      <HeaderMessageContent user={selectedUser} />
      <MainMessageContent messages={messages} selectedUser={selectedUser} />
      <FooterMessageContent onSendMessage={handleSendMessage} />
    </div>
  );
};

export default MessageContents;
