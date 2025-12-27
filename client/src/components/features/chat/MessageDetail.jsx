import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  MessageCircle,
  X,
  ArrowLeft,
  MoreHorizontal,
  Send,
  Image as ImageIcon,
  Smile,
  CheckCheck,
  Loader2,
  Trash2,
  Copy,
  Flag,
  Phone,
  Video,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useConversations,
  useConversationById,
  useMessages,
  useMarkAsRead,
  useSendMessage,
  useDeleteMessage,
  useUpdateGroup,
  useAddGroupMember,
  useRemoveGroupMember,
  useLeaveGroup,
} from '../../../hooks/useMessageQuery';
import { useSocketContext } from '../../../contexts/SocketContext';
import { lazy, Suspense } from 'react';

// Lazy load modals
const ReportModal = lazy(() =>
  import('../report').then(module => ({ default: module.ReportModal }))
);
const GroupInfoModal = lazy(() => import('./GroupInfoModal'));

// --- Sub-components ---

const TypingIndicator = ({ username }) => (
  <div className="flex items-center gap-3 px-4 py-3 animate-fade-in transition-all">
    <div className="flex gap-1.5 bg-surface-secondary px-3 py-2 rounded-2xl rounded-bl-none border border-border">
      <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" />
    </div>
    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-tight">
      {username} đang soạn...
    </span>
  </div>
);

const MessageBubble = ({
  message,
  isOwn,
  showAvatar,
  avatar,
  onDelete,
  onReport,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Đã sao chép tin nhắn');
    setShowMenu(false);
  };

  return (
    <div
      className={`flex w-full mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`flex max-w-[85%] sm:max-w-[70%] group ${
          isOwn ? 'flex-row-reverse' : 'flex-row'
        } items-end gap-2 relative`}
      >
        {/* Avatar */}
        {!isOwn && (
          <div className="w-8 h-8 flex-shrink-0">
            {showAvatar ? (
              <img
                src={avatar || 'https://via.placeholder.com/150'}
                alt=""
                className="w-8 h-8 rounded-full object-cover border border-border shadow-sm"
              />
            ) : (
              <div className="w-8" />
            )}
          </div>
        )}

        {/* Bubble */}
        <div className="flex flex-col gap-1">
          <div
            className={`relative px-4 py-2.5 text-sm transition-all duration-200 ${
              isOwn
                ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-none shadow-sm'
                : 'bg-surface-secondary text-content rounded-2xl rounded-bl-none border border-border'
            }`}
            onContextMenu={e => {
              e.preventDefault();
              setShowMenu(true);
            }}
          >
            {message.content && (
              <p className="whitespace-pre-wrap leading-relaxed break-words font-medium">
                {message.content}
              </p>
            )}

            {message.media?.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.media.map((item, i) => (
                  <img
                    key={i}
                    src={item.url}
                    alt=""
                    className="rounded-xl max-w-full h-auto object-cover border border-border"
                  />
                ))}
              </div>
            )}

            <div
              className={`flex items-center justify-end gap-1 mt-1 ${
                isOwn ? 'opacity-60' : 'text-text-tertiary'
              } text-[10px] font-medium`}
            >
              <span>
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {isOwn && (
                <div className="ml-0.5">
                  {message.status === 'read' || message.isRead ? (
                    <CheckCheck size={12} />
                  ) : (
                    <CheckCheck size={12} className="opacity-40" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`p-1.5 rounded-full hover:bg-surface-hover opacity-0 group-hover:opacity-100 transition-all ${
            isOwn ? 'mr-1' : 'ml-1'
          }`}
        >
          <MoreHorizontal size={14} className="text-text-tertiary" />
        </button>

        {/* Floating Menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-[60]"
              onClick={() => setShowMenu(false)}
            />
            <div
              className={`absolute ${
                isOwn ? 'right-full mr-2' : 'left-full ml-2'
              } bottom-2 z-[70] bg-surface rounded-xl shadow-lg border border-border py-1.5 min-w-[150px] animate-scale-in`}
            >
              <button
                onClick={handleCopy}
                className="w-full px-4 py-2 text-left text-xs font-bold flex items-center gap-2.5 hover:bg-surface-hover text-content transition-colors"
              >
                <Copy size={16} /> Sao chép
              </button>
              {isOwn ? (
                <button
                  onClick={() => {
                    onDelete(message._id || message.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-bold flex items-center gap-2.5 hover:bg-error/5 text-error transition-colors"
                >
                  <Trash2 size={16} /> Gỡ bỏ
                </button>
              ) : (
                <button
                  onClick={() => {
                    onReport(message._id || message.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-bold flex items-center gap-2.5 hover:bg-warning/5 text-warning transition-colors"
                >
                  <Flag size={16} /> Báo cáo
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

const MessageDetail = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected, joinRoom, leaveRoom, isUserOnline } =
    useSocketContext() || {};

  const { user: currentUser } = useSelector(state => state.auth);

  // Queries
  const { data: conversationsData } = useConversations();
  const conversationsList =
    conversationsData?.conversations || conversationsData || [];

  const { data: conversationData, isLoading: conversationLoading } =
    useConversationById(conversationId);

  const { data: messagesData, isLoading: messagesLoading } = useMessages({
    conversationId,
    page: 1,
    limit: 50,
  });
  const messagesList = messagesData?.messages || messagesData || [];

  // Mutations
  const markAsReadMutation = useMarkAsRead();
  const sendMessageMutation = useSendMessage();
  const deleteMessageMutation = useDeleteMessage();
  const updateGroupMutation = useUpdateGroup();
  const addMemberMutation = useAddGroupMember();
  const removeMemberMutation = useRemoveGroupMember();
  const leaveGroupMutation = useLeaveGroup();

  const [messageText, setMessageText] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [reportMessageId, setReportMessageId] = useState(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Derive conversation
  const conversation = useMemo(() => {
    if (conversationData) return conversationData;
    return conversationsList.find(
      c =>
        c._id === conversationId ||
        c.conversationId === conversationId ||
        c.id === conversationId ||
        c.directId === conversationId
    );
  }, [conversationData, conversationsList, conversationId]);

  const messages = messagesList;

  const otherUser = useMemo(() => {
    if (!conversation || conversation.isGroup) return null;

    // Explicitly find the person who is NOT the current user
    const other =
      conversation.otherUser ||
      conversation.participant ||
      conversation.members?.find(
        m => (m._id || m.id)?.toString() !== currentUser?._id?.toString()
      );

    return other;
  }, [conversation, currentUser]);

  const chatName = conversation?.isGroup
    ? conversation.name || 'Nhóm chat'
    : otherUser?.name ||
      otherUser?.fullName ||
      otherUser?.username ||
      'Đang tải...';
  const chatAvatar = conversation?.isGroup
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
        conversation.name || 'G'
      )}&background=random&size=100`
    : otherUser?.avatar || 'https://via.placeholder.com/150';

  const isOnline = otherUser?._id ? isUserOnline?.(otherUser._id) : false;

  // Lifecycle - Join room and fetch messages (only when conversationId changes)
  useEffect(() => {
    if (conversationId) {
      if (joinRoom) joinRoom(conversationId);
      markAsReadMutation.mutate(conversationId);
    }
    return () => {
      if (conversationId && leaveRoom) leaveRoom(conversationId);
    };
  }, [conversationId, joinRoom, leaveRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherUserTyping]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const isCurrentConversation = id => {
      return (
        id === conversationId ||
        (conversation &&
          (id === conversation?._id || id === conversation?.directId))
      );
    };

    const handleTyping = data => {
      if (
        isCurrentConversation(data.conversationId) &&
        data.senderId !== currentUser?._id
      ) {
        setIsOtherUserTyping(true);
      }
    };

    const handleStopTyping = data => {
      if (
        isCurrentConversation(data.conversationId) &&
        data.senderId !== currentUser?._id
      ) {
        setIsOtherUserTyping(false);
      }
    };

    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);
    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, isConnected, conversationId, currentUser?._id, conversation]);

  // Handlers
  const emitTyping = useCallback(
    isTyping => {
      if (!socket || !isConnected || !conversationId) return;
      socket.emit(isTyping ? 'user_typing' : 'user_stop_typing', {
        senderId: currentUser?._id,
        conversationId,
      });
    },
    [socket, isConnected, conversationId, currentUser?._id]
  );

  const handleInputChange = e => {
    setMessageText(e.target.value);
    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 2000);
  };

  const handleSend = async () => {
    if (!messageText.trim() && selectedImages.length === 0) return;
    emitTyping(false);
    try {
      await sendMessageMutation.mutateAsync({
        conversationId,
        content: messageText.trim(),
        type: selectedImages.length > 0 ? 'image' : 'text',
        attachments: selectedImages.length > 0 ? selectedImages : undefined,
      });
      setMessageText('');
      setSelectedImages([]);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gửi tin nhắn thất bại');
    }
  };

  const handleDelete = async mid => {
    try {
      await deleteMessageMutation.mutateAsync({
        conversationId,
        messageId: mid,
      });
      toast.success('Đã xóa tin nhắn');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể xóa tin nhắn');
    }
  };

  const handleGroupRename = async name => {
    try {
      setIsUpdatingGroup(true);
      await updateGroupMutation.mutateAsync({
        groupId: conversationId,
        data: { name },
      });
      toast.success('Đã đổi tên nhóm');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  const handleAddMember = async uid => {
    try {
      await addMemberMutation.mutateAsync({
        groupId: conversationId,
        memberIds: [uid],
      });
      toast.success('Đã thêm thành viên');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thêm thành viên thất bại');
    }
  };

  const handleRemoveMember = async uid => {
    try {
      await removeMemberMutation.mutateAsync({
        groupId: conversationId,
        userId: uid,
      });
      toast.success('Đã mời thành viên rời nhóm');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thực hiện thất bại');
    }
  };

  const handleLeave = async () => {
    if (window.confirm('Bạn có chắc muốn rời nhóm này?')) {
      try {
        await leaveGroupMutation.mutateAsync(conversationId);
        navigate('/messages');
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Rời nhóm thất bại');
      }
    }
  };

  if (!conversation && conversationLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-white dark:bg-neutral-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
          Đang tải cuộc trò chuyện...
        </p>
      </div>
    );
  }

  const isLoading = messagesLoading || conversationLoading;

  return (
    <div className="h-full flex flex-col bg-background animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 px-6 border-b border-border bg-surface/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/messages')}
            className="md:hidden p-2 -ml-2 rounded-full hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft size={20} className="text-secondary" />
          </button>

          <div
            className="relative group cursor-pointer"
            onClick={() => conversation?.isGroup && setShowGroupInfo(true)}
          >
            <img
              src={chatAvatar}
              alt=""
              className="w-11 h-11 rounded-full object-cover border border-border shadow-sm group-hover:scale-105 transition-transform"
            />
            {!conversation?.isGroup && isOnline && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full border-[3px] border-surface shadow-sm" />
            )}
          </div>

          <div
            className="min-w-0 flex flex-col cursor-pointer"
            onClick={() => conversation?.isGroup && setShowGroupInfo(true)}
          >
            <h2 className="font-bold text-content truncate text-base tracking-tight leading-tight">
              {chatName}
            </h2>
            <div className="flex items-center gap-1.5">
              {conversation?.isGroup ? (
                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-tight">
                  {conversation.members?.length || 0} thành viên
                </span>
              ) : (
                <span
                  className={`text-[10px] font-black uppercase tracking-tight ${
                    isOnline ? 'text-success' : 'text-text-tertiary'
                  }`}
                >
                  {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="yb-btn-ghost p-2.5 rounded-full transition-all text-secondary hover:text-primary">
            <Phone size={20} />
          </button>
          <button className="yb-btn-ghost p-2.5 rounded-full transition-all text-secondary hover:text-primary">
            <Video size={20} />
          </button>
          <button
            onClick={() => setShowGroupInfo(true)}
            className="yb-btn-ghost p-2.5 rounded-full transition-all text-secondary hover:text-primary"
          >
            <Info size={22} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 px-6 space-y-4 scroll-smooth custom-scrollbar relative bg-surface-secondary/30">
        {isLoading && messages.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-surface/50 backdrop-blur-[2px] z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
              Đang tải tin nhắn...
            </p>
          </div>
        ) : null}

        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="w-20 h-20 rounded-full bg-surface-secondary flex items-center justify-center border border-border">
              <MessageCircle size={32} className="text-text-tertiary" />
            </div>
            <div className="text-center">
              <p className="font-bold text-content">Chưa có tin nhắn nào</p>
              <p className="text-xs text-text-tertiary font-medium">
                Hãy gửi lời chào đến {chatName}!
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 min-h-full justify-end">
            {messages.map((msg, idx) => {
              const isOwn =
                msg.isMine ??
                (msg.sender?._id === currentUser?._id ||
                  msg.sender === currentUser?._id);
              const prevMsg = messages[idx - 1];
              const showAvatar =
                !isOwn &&
                (!prevMsg ||
                  (prevMsg.sender?._id || prevMsg.sender) !==
                    (msg.sender?._id || msg.sender));

              const sender = conversation?.isGroup
                ? conversation.members?.find(
                    m => m._id === (msg.sender?._id || msg.sender)
                  )
                : otherUser;

              return (
                <div key={msg._id || msg.id} className="w-full">
                  {conversation?.isGroup && !isOwn && showAvatar && (
                    <span className="text-[10px] font-bold text-text-tertiary ml-10 mb-1 block uppercase tracking-tight">
                      {sender?.name || 'Thành viên'}
                    </span>
                  )}
                  <MessageBubble
                    message={msg}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    avatar={sender?.avatar}
                    onDelete={handleDelete}
                    onReport={id => setReportMessageId(id)}
                  />
                </div>
              );
            })}
          </div>
        )}
        {isOtherUserTyping && (
          <TypingIndicator
            username={conversation?.isGroup ? 'Ai đó' : chatName}
          />
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="p-4 px-6 border-t border-border bg-surface">
        {selectedImages.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
            {selectedImages.map((file, i) => (
              <div
                key={i}
                className="relative group flex-shrink-0 animate-scale-in"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="w-20 h-20 rounded-xl object-cover border border-border shadow-md"
                />
                <button
                  onClick={() =>
                    setSelectedImages(prev =>
                      prev.filter((_, idx) => idx !== i)
                    )
                  }
                  className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 border border-border shadow-sm hover:bg-error transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e =>
              setSelectedImages(prev => [
                ...prev,
                ...Array.from(e.target.files),
              ])
            }
          />
          <div className="flex items-center bg-surface-secondary rounded-2xl flex-1 px-1 border border-border focus-within:border-border-focus focus-within:bg-white transition-all duration-300">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="yb-btn-ghost p-3 text-secondary hover:text-primary rounded-full transition-all"
            >
              <ImageIcon size={20} />
            </button>
            <button className="yb-btn-ghost p-3 text-secondary hover:text-primary rounded-full transition-all">
              <Smile size={20} />
            </button>
            <input
              type="text"
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-transparent border-none py-4 px-2 text-sm focus:outline-none text-content placeholder:text-text-tertiary font-medium"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={
              (!messageText.trim() && selectedImages.length === 0) ||
              sendMessageMutation.isPending
            }
            className={`yb-btn p-4 rounded-full transition-all duration-300 shadow-md ${
              (messageText.trim() || selectedImages.length > 0) &&
              !sendMessageMutation.isPending
                ? 'yb-btn-primary hover:scale-105 active:scale-95'
                : 'bg-surface-secondary text-text-tertiary cursor-not-allowed'
            }`}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <Send
                size={24}
                className={
                  messageText.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''
                }
              />
            )}
          </button>
        </div>
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        {showGroupInfo && (
          <GroupInfoModal
            isOpen={showGroupInfo}
            onClose={() => setShowGroupInfo(false)}
            conversation={conversation}
            currentUserId={currentUser?._id}
            onRename={handleRename => handleGroupRename(handleRename)}
            onAddMember={uid => handleAddMember(uid)}
            onRemoveMember={uid => handleRemoveMember(uid)}
            onLeaveGroup={handleLeave}
            isUpdating={isUpdatingGroup}
          />
        )}
        {reportMessageId && (
          <ReportModal
            isOpen={!!reportMessageId}
            onClose={() => setReportMessageId(null)}
            targetId={reportMessageId}
            targetType="message"
          />
        )}
      </Suspense>
    </div>
  );
};

export default MessageDetail;
