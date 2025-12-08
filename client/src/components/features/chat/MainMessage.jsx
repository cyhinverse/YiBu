import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useSocketContext } from "../../../contexts/SocketContext";
import { getConversations, deleteConversation } from "../../../redux/actions/messageActions";
import { ArrowLeft, Edit, Search, Trash2, MailPlus } from "lucide-react";
import Modal from "../../Common/Modal"; 
import { toast } from "react-hot-toast";

const MainMessage = ({ user }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isUserOnline, socket, joinRoom, leaveRoom } = useSocketContext();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newMessageMode, setNewMessageMode] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  // --- Socket Listeners & Initial Fetch ---
  const fetchConversations = useCallback(async () => {
      if (!user?._id) return;
      try {
          const res = await dispatch(getConversations()).unwrap();
          if (res) {
               setConversations(res || []);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  }, [user, dispatch]);

  useEffect(() => {
    fetchConversations();
    
    // Join sync logic
    const handleNewMessage = (data) => {
         const msg = data.message || data;
         if (!msg?._id) return;

         setConversations(prev => {
             const otherId = msg.sender?._id === user?._id ? msg.receiver?._id : msg.sender?._id;
             const exists = prev.find(c => c._id === otherId);
             
             if (exists) {
                 return prev.map(c => {
                     if (c._id === otherId) {
                         return {
                             ...c,
                             latestMessage: msg,
                             unreadCount: (msg.receiver?._id === user?._id && !msg.isRead) ? (c.unreadCount + 1) : c.unreadCount,
                             timestamp: new Date(msg.createdAt).getTime()
                         };
                     }
                     return c;
                 }).sort((a,b) => b.timestamp - a.timestamp);
             } else {
                 fetchConversations(); 
                 return prev;
             }
         });
    };

    // Socket Event Listeners
    if (socket) {
         socket.on("new_message", handleNewMessage);
         socket.on("message_read", fetchConversations);
    }
    
    if (user?._id) joinRoom(user._id);

    return () => {
        if (socket) {
            socket.off("new_message", handleNewMessage);
            socket.off("message_read", fetchConversations);
        }
        if (user?._id) leaveRoom(user._id);
    };
  }, [user, fetchConversations, socket, joinRoom, leaveRoom]);

  // --- Handlers ---
  const handleSearch = async (term) => {
      setSearchTerm(term);
      if (!term.trim()) {
          setSearchResults([]);
          return;
      }
      
      setIsSearching(true);
      try {
           const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/search?term=${term}`, {
               headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
           });
           const data = await res.json();
           if (data.code === 1) {
               setSearchResults(data.data.filter(u => u._id !== user?._id));
           }
      } catch(e) {
          console.error(e);
      } finally {
          setIsSearching(false);
      }
  };

  const handleDeleteConversation = async () => {
      if (!conversationToDelete) return;
      try {
          await dispatch(deleteConversation(conversationToDelete._id)).unwrap();
          setConversations(prev => prev.filter(c => c._id !== conversationToDelete._id));
          toast.success("Conversation deleted");
      } catch(e) {
          console.error(e);
          toast.error("Error deleting conversation");
      } finally {
          setConversationToDelete(null);
      }
  };

  const startConversation = (targetUser) => {
     navigate(`/messages/${targetUser._id}`, { state: { selectedUser: targetUser } });
  };

  // --- Render Helpers ---
  const formatTime = (dateStr) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
  };

  const filtered = conversations.filter(c => 
      c.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-surface shadow-none ">
      {/* --- HEADER --- */}
      <div className="p-3 px-4 flex justify-between items-center shrink-0 sticky top-0 bg-surface/80 backdrop-blur-md z-10">
          {newMessageMode ? (
              <div className="flex items-center w-full">
                  <button onClick={() => {setNewMessageMode(false); setSearchTerm(""); setSearchResults([])}} className="mr-4 p-2 -ml-2 rounded-full hover:bg-surface-highlight transition-colors">
                      <ArrowLeft size={18} className="text-text-primary"/>
                  </button>
                  <span className="font-bold text-xl flex-1 text-text-primary">New message</span>
              </div>
          ) : (
              <div className="w-full flex justify-between items-center">
                      <div className="px-4 py-2">
           <div className="relative group">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors">
                  <Search size={16}/>
               </div>
               <input 
                  value={searchTerm}
                  onChange={(e) => newMessageMode ? handleSearch(e.target.value) : setSearchTerm(e.target.value)}
                  placeholder={newMessageMode ? "Search people" : "Search Direct Messages"}
                  className="w-full py-2.5 pl-10 pr-4 rounded-full bg-surface-highlight border-transparent focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary text-[15px] text-text-primary placeholder:text-text-secondary transition-all outline-none"
               />
           </div>
      </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setNewMessageMode(true)} className="p-2 -mr-2 rounded-full hover:bg-surface-highlight transition-colors text-text-primary" title="New Message">
                        <MailPlus size={20}/>
                    </button>
                </div>
              </div>
          )}
      </div>

      {/* --- SEARCH --- */}


      {/* --- CONTENT --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading && <div className="text-center py-8 text-text-secondary text-sm">Loading...</div>}
          
          {newMessageMode ? (
              // User Search Results
              <div className="py-2">
                  {isSearching && <div className="text-center py-4 text-xs text-text-secondary">Searching...</div>}
                  {searchResults.length === 0 && !isSearching && searchTerm && (
                      <div className="p-8 text-center text-text-secondary">No people found</div>
                  )}
                  {searchResults.map(u => (
                      <div key={u._id} onClick={() => startConversation(u)} className="flex items-center px-4 py-3 hover:bg-surface-highlight bg-surface transition-colors cursor-pointer">
                           <img src={u.avatar || "https://via.placeholder.com/40"} className="w-10 h-10 rounded-full mr-3 object-cover border border-surface-highlight"/>
                           <div className="flex flex-col">
                               <div className="font-bold text-text-primary text-[15px]">{u.username}</div>
                               <div className="text-sm text-text-secondary">@{u.username}</div>
                           </div>
                      </div>
                  ))}
              </div>
          ) : (
              // Conversations List
              <div className="">
                  {filtered.length === 0 && !loading && (
                      <div className="p-8 text-center">
                          <h3 className="text-xl font-bold text-text-primary mb-2">Welcome to your inbox!</h3>
                          <p className="text-text-secondary">Drop a line, share posts and more with private conversations between you and others on X.</p>
                          <button onClick={() => setNewMessageMode(true)} className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all">
                              Write a message
                          </button>
                      </div>
                  )}
                  {filtered.map(conv => {
                      const isActive = isUserOnline(conv._id);
                      const isUnread = conv.unreadCount > 0;
                      return (
                          <div 
                            key={conv._id} 
                            onClick={() => startConversation(conv.user)}
                            className={`group relative flex items-center px-4 py-3 hover:bg-surface-highlight/50 transition-colors cursor-pointer ${isUnread ? "bg-surface-highlight/10" : "bg-surface"}`}
                          >
                              <div className="relative mr-3 self-start">
                                  <img src={conv.user?.avatar || "https://via.placeholder.com/40"} className="w-10 h-10 rounded-full border border-surface-highlight object-cover"/>
                                  {isActive && <div className="absolute -bottom-0 -right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface"/>}
                              </div>
                              <div className="flex-1 min-w-0 pr-6">
                                  <div className="flex justify-between items-baseline mb-0.5">
                                      <div className="flex items-center gap-1 min-w-0">
                                         <h4 className={`text-[15px] truncate text-text-primary ${isUnread ? "font-bold" : "font-semibold"}`}>{conv.user?.name || conv.user?.username || "User"}</h4>
                                         <span className="text-text-secondary text-[14px] truncate">@{conv.user?.username}</span>
                                      </div>
                                      <span className="text-[12px] text-text-secondary shrink-0 ml-2">{formatTime(conv.latestMessage?.createdAt)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <p className={`text-[14px] truncate w-full ${isUnread ? "text-text-primary font-medium" : "text-text-secondary"}`}>
                                          {conv.latestMessage?.sender === user?._id && "You: "}
                                          {conv.latestMessage?.media ? "Sent a photo" : conv.latestMessage?.content}
                                      </p>
                                      {isUnread && (
                                          <span className="ml-2 bg-primary w-2 h-2 rounded-full shrink-0"/>
                                      )}
                                  </div>
                              </div>
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); setConversationToDelete(conv); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-secondary hover:text-red-500 hover:bg-red-50/50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete conversation"
                              >
                                  <Trash2 size={16}/>
                              </button>
                          </div>
                      );
                  })}
              </div>
          )}
      </div>

      <Modal 
          isOpen={!!conversationToDelete}
          onClose={() => setConversationToDelete(null)}
          title="Delete Conversation"
          size="sm"
      >
          <div className="p-4 pt-0 text-center">
               <p className="text-text-secondary mb-6 text-sm">
                   Are you sure you want to delete the conversation with <span className="font-bold text-text-primary">{conversationToDelete?.user?.name}</span>? This action cannot be undone.
               </p>
               <div className="flex flex-col gap-3">
                    <button onClick={handleDeleteConversation} className="w-full py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold transition-colors">Delete</button>
                    <button onClick={() => setConversationToDelete(null)} className="w-full py-2.5 rounded-full border border-surface-highlight hover:bg-surface-highlight text-text-primary font-medium transition-colors">Cancel</button>
               </div>
          </div>
      </Modal>
    </div>
  );
};

export default MainMessage;
