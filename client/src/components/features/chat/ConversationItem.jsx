import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useSocketContext } from '@/contexts/SocketContext';

const ConversationItem = ({
  conversation,
  isActive,
  onClick,
  currentUserId,
}) => {
  const { isUserOnline } = useSocketContext() || {};

  const displayUser = conversation.otherUser ||
    conversation.members?.find(m => m._id !== currentUserId) ||
    conversation.participant || {
      name: 'Unknown User',
      username: 'unknown',
      avatar: 'https://via.placeholder.com/150',
    };

  const isOnline = displayUser?._id ? isUserOnline?.(displayUser._id) : false;

  const isUnread =
    conversation.unreadCount > 0 ||
    (conversation.lastMessage &&
      !conversation.lastMessage.seenBy?.some(s => s.user === currentUserId) &&
      conversation.lastMessage.sender !== currentUserId &&
      !conversation.lastMessage.isMine);

  const lastMessageContent =
    conversation.lastMessage?.content ||
    conversation.lastMessage?.text ||
    (conversation.lastMessage?.media?.length > 0
      ? 'Đã gửi một tệp đính kèm'
      : 'Bắt đầu trò chuyện');

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center gap-4 p-4 cursor-pointer group transition-all duration-300 ${
        isActive
          ? 'bg-surface-secondary'
          : 'bg-transparent hover:bg-surface-hover'
      }`}
    >
      {/* Active Indicator Bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
      )}

      <div className="relative flex-shrink-0">
        <img
          src={displayUser.avatar || 'https://via.placeholder.com/150'}
          alt={displayUser.name}
          className={`w-12 h-12 rounded-full object-cover border-2 shadow-sm transition-all duration-300 ${
            isActive ? 'border-primary' : 'border-border'
          }`}
        />
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-[3px] border-surface shadow-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={`text-sm truncate transition-colors duration-300 ${
              isUnread || isActive
                ? 'font-bold text-content'
                : 'font-medium text-secondary'
            }`}
          >
            {conversation.isGroup
              ? conversation.name
              : displayUser.name ||
                displayUser.fullName ||
                displayUser.username}
          </span>
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-tighter">
            {conversation.updatedAt || conversation.lastMessage?.createdAt
              ? formatDistanceToNow(
                  new Date(
                    conversation.updatedAt ||
                      conversation.lastMessage?.createdAt
                  ),
                  {
                    addSuffix: false,
                    locale: vi,
                  }
                )
              : ''}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-xs truncate transition-colors duration-300 ${
              isUnread
                ? 'text-primary font-semibold'
                : 'text-text-tertiary font-medium'
            }`}
          >
            {lastMessageContent}
          </p>
          {conversation.unreadCount > 0 ? (
            <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-bold text-white bg-primary rounded-full">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          ) : isUnread ? (
            <div className="w-2 h-2 rounded-full bg-primary" />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
