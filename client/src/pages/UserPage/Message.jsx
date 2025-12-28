import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Outlet, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, Settings, MessageCircle, Loader2, Users } from 'lucide-react';
import {
  useConversations,
  useCreateConversation,
  useCreateGroup,
} from '@/hooks/useMessageQuery';
import { useSearchUsers } from '@/hooks/useSearchQuery';
import ConversationItem from '@/components/features/chat/ConversationItem';
import CreateGroupModal from '@/components/features/chat/CreateGroupModal';
import { useDebounce } from '@/hooks/useDebounce';

function Message() {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const { data: conversationsData, isLoading: conversationsLoading } =
    useConversations();
  const conversations =
    conversationsData?.conversations || conversationsData || [];

  const { user } = useSelector(state => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const debouncedUserSearch = useDebounce(userSearchTerm, 500);

  const createConversationMutation = useCreateConversation();
  const createGroupMutation = useCreateGroup();

  const { data: searchResultsData, isLoading: isSearchingUsers } =
    useSearchUsers({
      query: debouncedUserSearch,
      page: 1,
      limit: 5,
    });
  const searchResults = searchResultsData?.users || searchResultsData || [];

  // Handle Deep Linking / Sync Route
  useEffect(() => {
    const handleSync = async () => {
      if (!conversationId || conversationId === 'messages') return;

      const existing = conversations.find(
        c =>
          c._id === conversationId ||
          c.conversationId === conversationId ||
          c.id === conversationId ||
          c.directId === conversationId
      );

      if (
        existing &&
        conversationId.includes('_') &&
        existing._id &&
        existing._id !== conversationId
      ) {
        navigate(`/messages/${existing._id}`, { replace: true });
        return;
      }

      if (!existing && !conversationsLoading) {
        // Match user1Id_user2Id format
        const pairMatch = conversationId.match(
          /^([a-f\d]{24})_([a-f\d]{24})$/i
        );
        if (pairMatch) {
          const [_, u1, u2] = pairMatch;
          const targetId = u1 === user?._id ? u2 : u1;
          if (targetId) {
            try {
              const conv = await createConversationMutation.mutateAsync(
                targetId
              );
              if (conv?._id && conv?._id !== conversationId) {
                navigate(`/messages/${conv._id}`, { replace: true });
              }
            } catch (err) {
              console.error('Failed to create/fetch conversation by pair', err);
            }
          }
        }
      }
    };

    if (user) handleSync();
  }, [
    conversationId,
    conversations,
    user,
    conversationsLoading,
    navigate,
    createConversationMutation,
  ]);

  const filteredConversations = useMemo(() => {
    if (!Array.isArray(conversations)) return [];
    return conversations.filter(c => {
      const otherUser =
        c.otherUser ||
        c.participant ||
        c.members?.find(m => m._id !== user?._id);
      const name = c.isGroup
        ? c.name || 'Nhóm'
        : otherUser?.name || otherUser?.fullName || otherUser?.username || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery, user?._id]);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length < 2) return;
    try {
      const newGroup = await createGroupMutation.mutateAsync({
        name: groupName,
        participantIds: selectedUsers.map(u => u._id),
      });

      setShowGroupModal(false);
      setGroupName('');
      setSelectedUsers([]);
      navigate(`/messages/${newGroup._id || newGroup.id}`);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const toggleUserSelection = user => {
    if (selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  return (
    <div className="flex w-full h-[calc(100vh-4rem)] md:h-screen bg-transparent overflow-hidden">
      {/* Left Sidebar (Conversation List) */}
      <div
        className={`w-full md:w-[380px] lg:w-[400px] flex-shrink-0 border-r border-border flex flex-col bg-background transition-all ${
          conversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-content tracking-tight">
              Tin nhắn
            </h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowGroupModal(true)}
                className="yb-btn-ghost p-2.5 rounded-full transition-all text-secondary hover:text-primary"
                title="Tạo nhóm chat"
              >
                <Users size={22} />
              </button>
              <button className="yb-btn-ghost p-2.5 rounded-full transition-all text-secondary hover:text-primary">
                <Settings size={22} />
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="relative group">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm cuộc trò chuyện..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-secondary text-content border border-transparent focus:border-border-focus placeholder:text-text-tertiary text-sm focus:outline-none transition-all duration-300"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-0">
          {conversationsLoading && conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-text-tertiary font-medium">
                Đang tải cuộc trò chuyện...
              </p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-surface-secondary rounded-3xl flex items-center justify-center border border-border">
                <MessageCircle size={32} className="text-text-tertiary" />
              </div>
              <p className="text-text-tertiary text-sm font-medium">
                {searchQuery
                  ? 'Không tìm thấy kết quả'
                  : 'Chưa có cuộc trò chuyện nào'}
              </p>
            </div>
          ) : (
            <div className="">
              {filteredConversations.map(conversation => {
                const id =
                  conversation._id ||
                  conversation.conversationId ||
                  conversation.id;
                return (
                  <ConversationItem
                    key={id}
                    conversation={conversation}
                    isActive={
                      !!conversationId &&
                      (conversationId === id ||
                        conversation.directId === conversationId)
                    }
                    onClick={() => navigate(`/messages/${id}`)}
                    currentUserId={user?._id}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Content Area (Rendered via Outlet) */}
      <div
        className={`flex-1 min-w-0 bg-background flex flex-col ${
          conversationId ? 'flex' : 'hidden md:flex'
        }`}
      >
        <Outlet />
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        groupName={groupName}
        setGroupName={setGroupName}
        searchQuery={userSearchTerm}
        onSearchChange={setUserSearchTerm}
        searchResults={searchResults}
        selectedUsers={selectedUsers}
        onToggleUser={toggleUserSelection}
        isSearching={isSearchingUsers}
        onSubmit={handleCreateGroup}
      />
    </div>
  );
}

export default Message;
