import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkAsRead,
} from '@/hooks/useMessageQuery';
import { notify } from '@/utils/notify';

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
  const { mutate: markAsRead } = useMarkAsRead();

  useEffect(() => {
    if (selectedChatId) {
      markAsRead(selectedChatId);
    }
  }, [markAsRead, selectedChatId]);

  // Scroll to bottom
  const messages = useMemo(
    () => messagesData?.messages ?? messagesData ?? [],
    [messagesData]
  );
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedChatId]);

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
      notify.error(error?.response?.data?.message || 'Gửi tin nhắn thất bại');
    }
  };

  const loading = conversationsLoading || messagesLoading;
  const conversations =
    conversationsData?.conversations || conversationsData || [];

  return (
    <div className="h-[calc(100vh-8rem)] admin-card flex overflow-hidden">

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

