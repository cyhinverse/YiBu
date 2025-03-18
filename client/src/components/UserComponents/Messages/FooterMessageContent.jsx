import React, { useState } from "react";
import { Send } from "lucide-react";

const FooterMessageContent = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-white rounded-xl shadow-md border border-gray-300 p-4 flex items-center gap-4"
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 outline-none"
      />
      <button
        type="submit"
        className="bg-purple-500 text-white p-2 rounded-full hover:bg-purple-600 transition-colors"
      >
        <Send size={20} />
      </button>
    </form>
  );
};

export default FooterMessageContent;
