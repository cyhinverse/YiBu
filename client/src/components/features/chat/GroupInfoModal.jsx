import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { X, Edit, Search, UserPlus, UserMinus, Check, LogOut, Loader2 } from 'lucide-react';
import { searchUsers } from '../../../redux/actions/userActions';

const GroupInfoModal = ({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  onRename,
  onAddMember,
  onRemoveMember,
  onLeaveGroup,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(conversation?.name || '');
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (conversation) {
      setNewName(conversation.name || '');
    }
  }, [conversation]);

  if (!isOpen || !conversation) return null;

  const isAdmin =
    conversation.admin === currentUserId ||
    conversation.members?.[0]?._id === currentUserId;

  const handleRename = () => {
    if (newName.trim() && newName !== conversation.name) {
      onRename(newName);
      setIsEditingName(false);
    }
  };

  const handleSearchUsers = async query => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const result = await dispatch(
        searchUsers({ query, page: 1, limit: 5 })
      ).unwrap();
      setSearchResults(result.users || []);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-neutral-200 dark:border-neutral-800">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-bold text-black dark:text-white">
            Thông tin nhóm
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
          {/* Group Branding */}
          <div className="flex flex-col items-center gap-4">
             <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {conversation.name ? conversation.name.charAt(0).toUpperCase() : 'G'}
             </div>
             <div className="w-full flex items-center justify-center gap-2">
                {isEditingName ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleRename}
                      className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="p-2 bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-black dark:text-white truncate">
                      {conversation.name || 'Nhóm chưa đặt tên'}
                    </h3>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setIsEditingName(true);
                          setNewName(conversation.name || '');
                        }}
                        className="p-2 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-full transition-all"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                  </>
                )}
             </div>
          </div>

          {/* Members Listing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                Thành viên ({conversation.members?.length || 0})
              </h4>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <UserPlus size={16} /> Thêm mới
                </button>
              )}
            </div>

            {/* Add Member Search Area */}
            {showAddMember && (
              <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 animate-in fade-in slide-in-from-top-2">
                <div className="relative mb-3">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => handleSearchUsers(e.target.value)}
                    placeholder="Tìm tên bạn bè..."
                    className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-black dark:text-white"
                  />
                </div>
                {isSearching ? (
                   <div className="flex justify-center p-4">
                      <Loader2 size={20} className="animate-spin text-blue-500" />
                   </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-52 overflow-y-auto space-y-2 custom-scrollbar">
                    {searchResults.map(user => {
                      const isMember = conversation.members?.some(
                        m => m._id === user._id
                      );
                      return (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-2.5 hover:bg-white dark:hover:bg-neutral-800 rounded-xl transition-colors border border-transparent hover:border-neutral-100 dark:hover:border-neutral-700"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatar || 'https://via.placeholder.com/150'}
                              className="w-9 h-9 rounded-full object-cover border border-neutral-100"
                              alt=""
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-black dark:text-white truncate">
                                {user.name}
                              </p>
                              <p className="text-[10px] text-neutral-500">@{user.username}</p>
                            </div>
                          </div>
                          {isMember ? (
                            <span className="text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-500 px-2 py-1 rounded-md font-medium">
                              Đã có mặt
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                onAddMember(user._id);
                                setSearchQuery('');
                                setSearchResults([]);
                                setShowAddMember(false);
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                              Thêm
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  searchQuery && <p className="text-center text-xs text-neutral-500 py-4">Không tìm thấy ai</p>
                )}
              </div>
            )}

            <div className="space-y-4">
              {conversation.members?.map(member => (
                <div
                  key={member._id}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar || 'https://via.placeholder.com/150'}
                      alt={member.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-neutral-100 dark:border-neutral-800 shadow-sm"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-black dark:text-white text-sm truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        @{member.username} 
                        {conversation.admin === member._id && (
                          <span className="ml-2 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full uppercase font-bold">Trưởng nhóm</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {isAdmin && member._id !== currentUserId && (
                    <button
                      onClick={() => onRemoveMember(member._id)}
                      className="p-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      title="Mời ra khỏi nhóm"
                    >
                      <UserMinus size={18} />
                    </button>
                  )}
                  {member._id === currentUserId && (
                    <span className="text-xs text-neutral-400 font-medium bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                      Bạn
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30">
          <button
            onClick={onLeaveGroup}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all border border-red-100 dark:border-red-900/20"
          >
            <LogOut size={20} />
            Rời khỏi nhóm này
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
