import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, Edit, MessageSquare, Trash2, X, ChevronRight, Users
} from "lucide-react";
import { messageManager } from "../../../socket/messageManager";
import { toast } from "react-hot-toast";
import { useSocketContext } from "../../../contexts/SocketContext";
import MessageService from "../../../services/messageService";
import { Modal } from "../../Common/Modal";

const MainMessage = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const { isUserOnline } = useSocketContext();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newMessageMode, setNewMessageMode] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]); // For new message group/single

  // --- Socket Listeners & Initial Fetch ---
  const fetchConversations = useCallback(async () => {
      if (!user?._id) return;
      try {
          const res = await MessageService.getConversations();
          if (res.success) {
               setConversations(res.data || []);
          } else {
               // Silent fail or toast
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  }, [user]);

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

    const unsubNew = messageManager.onNewMessage(handleNewMessage);
    const unsubRead = messageManager.onMessageRead(() => fetchConversations()); // Simplified: just refetch
    
    if (user?._id) messageManager.joinRoom(user._id);

    return () => {
        unsubNew();
        unsubRead();
        if (user?._id) messageManager.leaveRoom(user._id);
    };
  }, [user, fetchConversations]);

  // --- Handlers ---
  const handleSearch = async (term) => {
      setSearchTerm(term);
      if (!term.trim()) {
          setSearchResults([]);
          return;
      }
      
      setIsSearching(true);
      try {
           // Assuming UserService or standard fetch
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
          const res = await MessageService.deleteConversation(conversationToDelete._id);
          if (res.success) {
              setConversations(prev => prev.filter(c => c._id !== conversationToDelete._id));
              toast.success("Conversation deleted");
          } else {
              toast.error("Failed to delete");
          }
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
    <div className="h-full flex flex-col bg-surface shadow-sm overflow-hidden border border-surface-highlight">
      {/* --- HEADER --- */}
      <div className="p-4 border-b border-surface-highlight flex justify-between items-center shrink-0">
          {newMessageMode ? (
              <div className="flex items-center w-full">
                  <button onClick={() => setNewMessageMode(false)} className="mr-3 p-1 rounded-full hover:bg-surface-highlight">
                      <ArrowLeft size={18}/>
                  </button>
                  <span className="font-semibold text-lg flex-1 text-text-primary">New Message</span>
              </div>
          ) : (
              <>
                <h2 className="text-xl font-bold flex items-center text-text-primary">
                    <MessageSquare size={22} className="mr-2 text-primary"/>
                    Messages
                </h2>
                <button onClick={() => setNewMessageMode(true)} className="p-2 rounded-full hover:bg-primary/10 text-primary">
                    <Edit size={20}/>
                </button>
              </>
          )}
      </div>

      {/* --- SEARCH --- */}
      <div className="px-4 py-3">
           <div className="relative">
               <input 
                  value={searchTerm}
                  onChange={(e) => newMessageMode ? handleSearch(e.target.value) : setSearchTerm(e.target.value)}
                  placeholder={newMessageMode ? "Search users..." : "Search messages..."}
                  className="w-full py-2 pl-10 pr-4 rounded-full bg-surface-highlight border-none focus:ring-1 focus:ring-primary text-sm text-text-primary placeholder:text-text-secondary"
               />
               <Search className="absolute left-3 top-2.5 text-text-secondary" size={16}/>
           </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
          {loading && <div className="text-center py-4 text-text-secondary">Loading...</div>}
          
          {newMessageMode ? (
              // User Search Results
              <div className="space-y-1">
                  {isSearching && <div className="text-center py-2 text-xs text-text-secondary">Searching...</div>}
                  {searchResults.map(u => (
                      <div key={u._id} onClick={() => startConversation(u)} className="flex items-center p-3 hover:bg-surface-highlight rounded-lg cursor-pointer">
                           <img src={u.avatar || "https://via.placeholder.com/40"} className="w-10 h-10 rounded-full mr-3 object-cover"/>
                           <div>
                               <div className="font-medium text-text-primary">{u.username}</div>
                               <div className="text-xs text-text-secondary">{u.name}</div>
                           </div>
                      </div>
                  ))}
              </div>
          ) : (
              // Conversations List
              <div className="space-y-1">
                  {filtered.length === 0 && !loading && (
                      <div className="text-center py-10 text-text-secondary">No conversations found</div>
                  )}
                  {filtered.map(conv => {
                      const isActive = isUserOnline(conv._id);
                      return (
                          <div 
                            key={conv._id} 
                            onClick={() => startConversation(conv.user)}
                            className="group relative flex items-center p-3 hover:bg-primary/5 rounded-xl cursor-pointer transition-colors"
                          >
                              <div className="relative mr-3">
                                  <img src={conv.user?.avatar || "https://via.placeholder.com/40"} className="w-12 h-12 rounded-full border border-surface-highlight object-cover"/>
                                  {isActive && <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface"/>}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-baseline mb-1">
                                      <h4 className="font-semibold text-text-primary truncate">{conv.user?.name || "User"}</h4>
                                      <span className="text-xs text-text-secondary shrink-0">{formatTime(conv.latestMessage?.createdAt)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <p className={`text-sm truncate w-full ${conv.unreadCount > 0 ? "text-text-primary font-medium" : "text-text-secondary"}`}>
                                          {conv.latestMessage?.sender === user?._id && "You: "}
                                          {conv.latestMessage?.media ? "Sent a photo" : conv.latestMessage?.content}
                                      </p>
                                      {conv.unreadCount > 0 && (
                                          <span className="ml-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                                              {conv.unreadCount}
                                          </span>
                                      )}
                                  </div>
                              </div>
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); setConversationToDelete(conv); }}
                                className="absolute right-2 p-2 text-text-secondary hover:text-error hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity top-1/2 -translate-y-1/2"
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
          <div className="text-center">
               <p className="text-text-secondary mb-6">
                   Are you sure you want to delete the conversation with <span className="font-semibold text-text-primary">{conversationToDelete?.user?.name}</span>?
               </p>
               <div className="flex justify-end gap-3">
                    <button onClick={() => setConversationToDelete(null)} className="px-4 py-2 rounded-lg bg-surface-highlight hover:bg-gray-200 text-text-primary">Cancel</button>
                    <button onClick={handleDeleteConversation} className="px-4 py-2 rounded-lg bg-error hover:bg-red-700 text-white">Delete</button>
               </div>
          </div>
      </Modal>
    </div>
  );
};

export default MainMessage;
