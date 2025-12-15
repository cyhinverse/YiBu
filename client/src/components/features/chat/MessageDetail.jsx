import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getConversationById,
  createConversation,
  deleteMessage,
} from '../../../redux/actions/messageActions';
import { ReportModal } from '../report';

const formatTime = dateStr => {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const MessageBubble = ({
  message,
  isSentByCurrentUser,
  showAvatar,
  receiverUser,
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
      className={`flex mb-2 ${
        isSentByCurrentUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`flex max-w-[75%] ${
          isSentByCurrentUser ? 'flex-row-reverse' : 'flex-row'
        } items-end gap-2 group relative`}
      >
        {/* Avatar */}
        {!isSentByCurrentUser && (
          <div className="w-8 h-8 flex-shrink-0">
            {showAvatar ? (
              <img
                src={receiverUser?.avatar}
                alt={receiverUser?.username}
                className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
              />
            ) : (
              <div className="w-8" />
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative px-4 py-2.5 text-sm ${
            isSentByCurrentUser
              ? 'bg-black dark:bg-white text-white dark:text-black rounded-2xl rounded-br-md'
              : 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white rounded-2xl rounded-bl-md'
          }`}
          onContextMenu={e => {
            e.preventDefault();
            setShowMenu(true);
          }}
        >
          <p className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
          <div
            className={`text-[10px] mt-1 flex items-center justify-end ${
              isSentByCurrentUser
                ? 'text-white/70 dark:text-black/50'
                : 'text-neutral-400'
            }`}
          >
            {formatTime(message.createdAt)}
            {isSentByCurrentUser && message.isRead && (
              <CheckCheck size={12} className="ml-1" />
            )}
          </div>

          {/* Context menu button - shown on hover */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`absolute ${
              isSentByCurrentUser
                ? 'left-0 -translate-x-full -ml-1'
                : 'right-0 translate-x-full mr-1'
            } top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all`}
          >
            <MoreHorizontal size={14} className="text-neutral-400" />
          </button>
        </div>

        {/* Context Menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div
              className={`absolute ${
                isSentByCurrentUser ? 'right-0' : 'left-8'
              } top-full mt-1 z-50 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 min-w-[140px]`}
            >
              <button
                onClick={handleCopy}
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-black dark:text-white"
              >
                <Copy size={14} />
                Copy
              </button>
              {isSentByCurrentUser ? (
                <button
                  onClick={() => {
                    onDelete(message._id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-red-500"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              ) : (
                <button
                  onClick={() => {
                    onReport(message._id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-red-500"
                >
                  <Flag size={14} />
                  Report
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MessageDetail = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux state
  const { currentUser } = useSelector(state => state.auth);
  const {
    messages: messagesState,
    loading,
    sendLoading,
  } = useSelector(state => state.message);

  // Local state
  const [messageText, setMessageText] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [reportMessageId, setReportMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get receiver user from location state or conversation
  const [receiverUser, setReceiverUser] = useState(
    location.state?.selectedUser || null
  );
  const messages = messagesState[conversationId] || [];

  // Handle delete message
  const handleDeleteMessage = useCallback(
    async messageId => {
      try {
        await dispatch(deleteMessage({ conversationId, messageId })).unwrap();
        toast.success('Đã xóa tin nhắn');
      } catch (error) {
        toast.error(error || 'Xóa tin nhắn thất bại');
      }
    },
    [conversationId, dispatch]
  );

  // Fetch conversation info if not passed via state
  useEffect(() => {
    const fetchConversation = async () => {
      if (!receiverUser && conversationId) {
        try {
          const result = await dispatch(
            getConversationById(conversationId)
          ).unwrap();
          if (result.data) {
            const conversation = result.data;
            const otherParticipant = conversation.participants?.find(
              p => p._id !== currentUser?._id
            );
            setReceiverUser(otherParticipant);
          }
        } catch (error) {
          toast.error('Không thể tải thông tin hội thoại');
        }
      }
    };
    fetchConversation();
  }, [conversationId, receiverUser, currentUser?._id, dispatch]);

  // Fetch messages
  useEffect(() => {
    if (conversationId) {
      dispatch(getMessages({ conversationId, page: 1, limit: 50 }));
      // Mark as read
      dispatch(markMessagesAsRead(conversationId));
    }
  }, [conversationId, dispatch]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!messageText.trim() && selectedImages.length === 0) return;

    try {
      await dispatch(
        sendMessage({
          conversationId,
          content: messageText.trim(),
          type: selectedImages.length > 0 ? 'image' : 'text',
          attachments: selectedImages.length > 0 ? selectedImages : undefined,
        })
      ).unwrap();

      setMessageText('');
      setSelectedImages([]);
    } catch (error) {
      toast.error(error || 'Gửi tin nhắn thất bại');
    }
  }, [conversationId, messageText, selectedImages, dispatch]);

  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = e => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedImages(prev => [...prev, ...files]);
    }
  };

  const removeSelectedImage = index => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-500" />
          </button>
          <img
            src={
              receiverUser?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                receiverUser?.username || 'default'
              }`
            }
            alt={receiverUser?.name || 'User'}
            className="w-10 h-10 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
          />
          <div>
            <h2 className="font-semibold text-black dark:text-white">
              {receiverUser?.name || receiverUser?.username || 'Loading...'}
            </h2>
            <p className="text-xs text-neutral-500">
              {receiverUser?.username ? `@${receiverUser.username}` : ''}
            </p>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          <MoreHorizontal size={20} className="text-neutral-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <p>Chưa có tin nhắn</p>
            <p className="text-sm">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isSentByCurrentUser =
              message.sender?._id === currentUser?._id;
            const showAvatar =
              !isSentByCurrentUser &&
              (index === 0 ||
                messages[index - 1]?.sender?._id !== message.sender?._id);

            return (
              <MessageBubble
                key={message._id}
                message={message}
                isSentByCurrentUser={isSentByCurrentUser}
                showAvatar={showAvatar}
                receiverUser={receiverUser}
                onDelete={handleDeleteMessage}
                onReport={id => setReportMessageId(id)}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Images Preview */}
      {selectedImages.length > 0 && (
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex gap-2 flex-wrap">
            {selectedImages.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <button
                  onClick={() => removeSelectedImage(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ImageIcon size={20} className="text-neutral-500" />
          </button>
          <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <Smile size={20} className="text-neutral-500" />
          </button>
          <input
            type="text"
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
          <button
            onClick={handleSend}
            disabled={
              (!messageText.trim() && selectedImages.length === 0) ||
              sendLoading
            }
            className={`p-2.5 rounded-full transition-all ${
              (messageText.trim() || selectedImages.length > 0) && !sendLoading
                ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {sendLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Report Message Modal */}
      <ReportModal
        isOpen={!!reportMessageId}
        onClose={() => setReportMessageId(null)}
        targetId={reportMessageId}
        targetType="message"
      />
    </div>
  );
};

export default MessageDetail;
