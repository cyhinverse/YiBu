import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Edit,
  MoreHorizontal,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { getConversations } from '../../../redux/actions/messageActions';

const formatTime = dateStr => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
};

const MainMessage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');

  const { conversations, loading, error } = useSelector(state => state.message);
  const { user: currentUser } = useSelector(state => state.auth);

  // Fetch conversations on mount
  useEffect(() => {
    dispatch(getConversations({ page: 1, limit: 50 }));
  }, [dispatch]);

  // Get the other participant in a conversation
  const getOtherParticipant = conversation => {
    if (conversation.isGroup) {
      return {
        name: conversation.groupName || 'Group',
        avatar: conversation.groupAvatar,
        _id: conversation._id,
      };
    }
    const participants = conversation.participants || [];
    return (
      participants.find(p => p._id !== currentUser?._id) || participants[0]
    );
  };

  const conversationList = conversations?.data || conversations || [];

  const filtered = conversationList.filter(c => {
    const participant = getOtherParticipant(c);
    return (
      participant?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-black dark:text-white">
            Messages
          </h1>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <Edit size={20} className="text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search conversations"
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading && conversationList.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <MessageCircle size={32} className="mx-auto text-red-400 mb-2" />
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={() => dispatch(getConversations({ page: 1, limit: 50 }))}
              className="mt-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm rounded-full"
            >
              Thử lại
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle
              size={32}
              className="mx-auto text-neutral-300 mb-2"
            />
            <p className="text-neutral-500 text-sm">
              {searchTerm ? 'No conversations found' : 'No messages yet'}
            </p>
          </div>
        ) : (
          filtered.map(conversation => {
            const participant = getOtherParticipant(conversation);
            return (
              <div
                key={conversation._id}
                onClick={() =>
                  navigate(`/messages/${conversation._id}`, {
                    state: {
                      selectedUser: participant,
                      conversationId: conversation._id,
                    },
                  })
                }
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      participant?.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant?.username}`
                    }
                    alt={participant?.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
                  />
                  {participant?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-black dark:text-white truncate">
                      {participant?.name || participant?.username}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {formatTime(
                        conversation.lastMessage?.createdAt ||
                          conversation.updatedAt
                      )}
                    </span>
                  </div>
                  <p
                    className={`text-sm truncate ${
                      conversation.unreadCount > 0
                        ? 'text-black dark:text-white font-medium'
                        : 'text-neutral-500'
                    }`}
                  >
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>

                {/* Unread Badge */}
                {conversation.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white dark:text-black">
                      {conversation.unreadCount}
                    </span>
                  </div>
                )}

                {/* More Options */}
                <button
                  onClick={e => e.stopPropagation()}
                  className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal size={16} className="text-neutral-400" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MainMessage;
