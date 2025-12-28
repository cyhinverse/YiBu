import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkAsRead,
} from '@/hooks/useMessageQuery';
import toast from 'react-hot-toast';

import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';

const Messages = () => {
  const { user: currentUser } = useSelector(state => state.auth);

  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const { data: conversationsData, isLoading: conversationsLoading } =
    useConversations({ page: 1, limit: 20 });

  const selectedChatId = selectedChat?._id || selectedChat?.id;
  const { data: messagesData, isLoading: messagesLoading } = useMessages({
    conversationId: selectedChatId,
    page: 1,
  });

  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();

  useEffect(() => {
    if (selectedChatId) {
      markAsReadMutation.mutate(selectedChatId);
    }
  }, [selectedChatId]);

  // Scroll to bottom
  const messages = messagesData?.messages || messagesData || [];
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat]);

  const handleSend = async e => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChatId) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedChatId,
        content: messageInput,
        type: 'text',
      });
      setMessageInput('');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gửi tin nhắn thất bại');
    }
  };

  const loading = conversationsLoading || messagesLoading;
  const conversations =
    conversationsData?.conversations || conversationsData || [];

  return (
    <div className="h-[calc(100vh-8rem)] bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        loading={loading}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
        currentUser={currentUser}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <ChatWindow
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
        messages={messages}
        currentUser={currentUser}
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        handleSend={handleSend}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
};

export default Messages;
