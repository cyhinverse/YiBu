import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  ArrowLeft, Phone, Video, Info, 
  Send, Image as ImageIcon, Smile, 
  Trash2, MoreVertical, CheckCheck, Loader2
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

import { useMessages } from "../../../hooks/useMessages";
import { useSocketContext } from "../../../contexts/SocketContext";
import { Modal } from "../../Common/Modal"; 

const MessageBubble = React.memo(({ message, isSentByCurrentUser, showAvatar, isConsecutiveMessage, receiverUser, onDelete, formatTime }) => {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div 
      className={`group flex mb-1 ${isSentByCurrentUser ? "justify-end" : "justify-start"} ${isConsecutiveMessage ? "mt-0.5" : "mt-3"}`}
      onMouseLeave={() => setShowOptions(false)}
    >
      <div className={`flex max-w-[75%] ${isSentByCurrentUser ? "flex-row-reverse" : "flex-row"} items-end`}>
        {/* Avatar */}
        {!isSentByCurrentUser && (
          <div className="w-8 h-8 mr-2 flex-shrink-0">
            {showAvatar ? (
              <img
                src={receiverUser?.avatar || "https://via.placeholder.com/40"}
                alt={receiverUser?.username}
                className="w-8 h-8 rounded-full object-cover border border-surface-highlight"
              />
            ) : <div className="w-8" />}
          </div>
        )}

        {/* Bubble */}
        <div className={`relative px-4 py-2 rounded-2xl text-sm shadow-sm transition-all
          ${isSentByCurrentUser 
            ? "bg-primary text-primary-foreground rounded-br-none" 
            : "bg-surface text-text-primary border border-surface-highlight rounded-bl-none"}
        `}>
          {message.media && (
              <div className="mb-2 rounded-lg overflow-hidden">
                  <img src={message.media} alt="content" className="max-w-full h-auto object-cover" />
              </div>
          )}
          
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          
          <div className={`text-[10px] mt-1 flex items-center justify-end opacity-70 ${isSentByCurrentUser ? "text-primary-foreground" : "text-text-secondary"}`}>
            {formatTime(message.createdAt)}
            {isSentByCurrentUser && message.isRead && (
               <CheckCheck size={12} className="ml-1" />
            )}
          </div>

          {/* Options Button */}
          {isSentByCurrentUser && (
             <button
               onClick={() => onDelete(message)}
               className={`absolute top-1/2 -translate-y-1/2 -left-8 p-1.5 rounded-full bg-surface-highlight text-text-secondary hover:text-error hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity`}
             >
               <Trash2 size={14} />
             </button>
          )}
        </div>
      </div>
    </div>
  );
});

const MessageDetail = () => {
    // ... (rest of the component logic)
    const { userId: receiverId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = useSelector(state => state.auth.user);
    const currentUserId = currentUser?._id || currentUser?.user?._id; 
    
    // --- User Info State ---
    const initialUser = location.state?.selectedUser;
    const [receiverUser, setReceiverUser] = useState(initialUser || null);
    
    // --- Internal State ---
    const [messageText, setMessageText] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [msgToDelete, setMsgToDelete] = useState(null);
    
    const fileInputRef = useRef(null);

    // --- Hooks ---
    const { 
        messages, 
        loading, 
        sending, 
        hasMore, 
        loadMore, 
        sendMessage, 
        deleteMessage,
        messagesEndRef
    } = useMessages(currentUserId, receiverId);

    const { isUserOnline } = useSocketContext();
    const isOnline = receiverId ? isUserOnline(receiverId) : false;

    // --- Fetch User Info if needed ---
    useEffect(() => {
        if (!receiverId || receiverUser) return;
        
        const fetchUser = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/${receiverId}`);
                const data = await res.json();
                if (data.code === 1) setReceiverUser(data.data);
            } catch (e) {
                console.error("Failed to fetch user info", e);
            }
        };
        fetchUser();
    }, [receiverId, receiverUser]);

    // --- Formatting ---
    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
    };

    // --- Handlers ---
    const handleSend = async () => {
        if (!messageText.trim() && !imageFile) return;
        const success = await sendMessage(messageText, imageFile);
        if (success) {
            setMessageText("");
            setImageFile(null);
            setPreviewImage(null);
            setShowEmoji(false);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const confirmDelete = async () => {
        if (msgToDelete) {
             await deleteMessage(msgToDelete._id);
             setMsgToDelete(null);
        }
    };

    if (!currentUserId) return <div className="flex h-full items-center justify-center">Please login</div>;

    return (
        <div className="flex flex-col h-full bg-background">
            {/* --- HEADER --- */}
            <div className="h-16 px-4 bg-surface border-b border-surface-highlight flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center">
                    <button onClick={() => navigate("/messages")} className="mr-3 p-2 rounded-full hover:bg-surface-highlight md:hidden">
                        <ArrowLeft size={20}/>
                    </button>
                    <div className="relative">
                         <img 
                            src={receiverUser?.avatar || "https://via.placeholder.com/40"} 
                            className="w-10 h-10 rounded-full border border-surface-highlight object-cover" 
                            alt="avatar"
                         />
                         {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface" />}
                    </div>
                    <div className="ml-3">
                        <h3 className="font-semibold text-text-primary">{receiverUser?.username || receiverUser?.name || "User"}</h3>
                        <span className="text-xs text-text-secondary">{isOnline ? "Active now" : "Offline"}</span>
                    </div>
                </div>
                <div className="flex space-x-2 text-text-secondary">
                    <Phone size={20} className="hover:text-primary cursor-pointer"/>
                    <Video size={20} className="hover:text-primary cursor-pointer"/>
                    <Info size={20} className="hover:text-primary cursor-pointer"/>
                </div>
            </div>

            {/* --- MESSAGES LIST --- */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {hasMore && (
                    <div className="flex justify-center mb-4">
                        <button 
                            onClick={loadMore} 
                            disabled={loading}
                            className="text-xs text-primary font-medium hover:underline"
                        >
                            {loading ? "Loading..." : "Load older messages"}
                        </button>
                    </div>
                )}
                
                {loading && !messages.length && (
                    <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-primary"/></div>
                )}

                {!loading && !messages.length && (
                     <div className="flex flex-col items-center justify-center h-full text-text-secondary">
                         <Send size={48} className="mb-2 opacity-20"/>
                         <p>No messages yet</p>
                     </div>
                )}

                {messages.map((msg, i) => {
                     const isMe = msg.sender === currentUserId || msg.sender?._id === currentUserId;
                     const isConsecutive = i > 0 && messages[i-1].sender?._id === msg.sender?._id;
                     
                     return (
                         <MessageBubble 
                            key={msg._id || i}
                            message={msg}
                            isSentByCurrentUser={isMe}
                            showAvatar={!isConsecutive}
                            isConsecutiveMessage={isConsecutive}
                            receiverUser={receiverUser}
                            onDelete={setMsgToDelete}
                            formatTime={formatTime}
                         />
                     );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* --- INPUT AREA --- */}
            <div className="p-3 bg-surface border-t border-surface-highlight shrink-0">
                {previewImage && (
                    <div className="mb-2 relative inline-block">
                        <img src={previewImage} className="h-20 rounded-lg border border-surface-highlight" alt="preview"/>
                        <button 
                            onClick={() => {setImageFile(null); setPreviewImage(null);}}
                            className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-0.5"
                        >
                            <Trash2 size={12}/>
                        </button>
                    </div>
                )}
                
                <div className="flex items-end gap-2">
                    <div className="flex-1 bg-surface-highlight rounded-2xl flex items-center px-2 py-1 relative">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-text-secondary hover:text-primary">
                           <ImageIcon size={20}/>
                        </button>
                        <input 
                            ref={fileInputRef} hidden type="file" accept="image/*" onChange={handleImageSelect}
                        />
                        
                        < textarea
                            value={messageText}
                            onChange={e => setMessageText(e.target.value)}
                            onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-2 text-sm max-h-32 min-h-[40px] text-text-primary placeholder-text-secondary"
                            rows={1}
                        />

                        <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 text-text-secondary hover:text-warning">
                            <Smile size={20} />
                        </button>
                        
                        {showEmoji && (
                            <div className="absolute bottom-12 right-0 z-50">
                                <EmojiPicker onEmojiClick={(e) => {
                                    setMessageText(prev => prev + e.emoji); 
                                    setShowEmoji(false);
                                }} />
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={handleSend}
                        disabled={sending || (!messageText.trim() && !imageFile)}
                        className={`p-3 rounded-full flex items-center justify-center transition-colors 
                            ${sending || (!messageText.trim() && !imageFile) ? "bg-surface-highlight text-text-secondary" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                        `}
                    >
                        {sending ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
                    </button>
                </div>
            </div>

            {/* --- DELETE MODAL --- */}
            <Modal
                isOpen={!!msgToDelete}
                onClose={() => setMsgToDelete(null)}
                title="Delete Message"
                size="sm"
            >
                <div className="text-center">
                    <p className="text-text-secondary mb-6">Are you sure you want to delete this message? This cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                         <button onClick={() => setMsgToDelete(null)} className="px-4 py-2 rounded-lg bg-surface-highlight text-text-primary hover:bg-gray-200">Cancel</button>
                         <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-error text-white hover:bg-red-700">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MessageDetail;
