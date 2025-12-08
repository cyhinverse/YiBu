import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  ArrowLeft, Info, 
  Send, Image as ImageIcon, Smile, 
  Trash2, X, CheckCheck, Loader2
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

import { useMessages } from "../../../hooks/useMessages";
import { useSocketContext } from "../../../contexts/SocketContext";
import Modal from "../../Common/Modal"; 

const MessageBubble = React.memo(({ message, isSentByCurrentUser, showAvatar, isConsecutiveMessage, receiverUser, onDelete, formatTime }) => {
  return (
    <div 
      className={`group flex mb-1 w-full ${isSentByCurrentUser ? "justify-end" : "justify-start"} ${isConsecutiveMessage ? "mt-0.5" : "mt-2"}`}
    >
      <div className={`flex max-w-[85%] sm:max-w-[70%] ${isSentByCurrentUser ? "flex-row-reverse" : "flex-row"} items-end`}>
        {/* Avatar */}
        {!isSentByCurrentUser && (
          <div className="w-8 h-8 mr-2 flex-shrink-0">
            {showAvatar ? (
              <img
                src={receiverUser?.avatar || "https://via.placeholder.com/40"}
                alt={receiverUser?.username}
                className="w-8 h-8 rounded-full object-cover shadow-sm"
              />
            ) : <div className="w-8" />}
          </div>
        )}

        {/* Bubble */}
        <div className={`relative px-4 py-2.5 text-[15px] shadow-sm transition-all break-words
          ${isSentByCurrentUser 
            ? "bg-primary text-white rounded-[20px] rounded-br-[4px]" 
            : "bg-surface-highlight text-text-primary rounded-[20px] rounded-bl-[4px]"}
        `}>
          {message.media && (
              <div className="mb-2 rounded-xl overflow-hidden shadow-sm">
                  <img src={message.media} alt="content" className="max-w-full h-auto object-cover" />
              </div>
          )}
          
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          
          <div className={`text-[10px] mt-1 flex items-center justify-end font-medium ${isSentByCurrentUser ? "text-white/70" : "text-text-secondary"}`}>
            {formatTime(message.createdAt)}
            {isSentByCurrentUser && message.isRead && (
               <CheckCheck size={12} className="ml-1" />
            )}
          </div>

          {/* Options Button */}
          {isSentByCurrentUser && (
             <button
               onClick={() => onDelete(message)}
               className={`absolute top-1/2 -translate-y-1/2 -left-8 p-1.5 rounded-full text-text-secondary hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all`}
               title="Delete"
             >
               <Trash2 size={15} />
             </button>
          )}
        </div>
      </div>
    </div>
  );
});

const MessageDetail = () => {
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

    if (!currentUserId) return <div className="flex h-full items-center justify-center text-text-secondary">Please login to chat</div>;

    return (
        <div className="flex flex-col h-full bg-surface relative">
            {/* --- HEADER --- */}
            <div className="h-[60px] px-4 bg-surface/80 backdrop-blur-md border-b border-surface-highlight flex items-center justify-between shrink-0 sticky top-0 z-20">
                <div className="flex items-center cursor-pointer" onClick={() => navigate(`/profile/${receiverId}`)}>
                    <button onClick={(e) => {e.stopPropagation(); navigate("/messages")}} className="mr-2 p-2 rounded-full hover:bg-surface-highlight md:hidden transition-colors">
                        <ArrowLeft size={20} className="text-text-primary"/>
                    </button>
                    <div className="relative">
                         <img 
                            src={receiverUser?.avatar || "https://via.placeholder.com/40"} 
                            className="w-9 h-9 rounded-full border border-surface-highlight object-cover" 
                            alt="avatar"
                         />
                         {isOnline && <div className="absolute -bottom-0 -right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface" />}
                    </div>
                    <div className="ml-3 flex flex-col">
                        <h3 className="font-bold text-text-primary text-[15px] leading-tight hover:underline">{receiverUser?.username || receiverUser?.name || "User"}</h3>
                        <span className="text-[12px] text-text-secondary">{isOnline ? "Active now" : "Offline"}</span>
                    </div>
                </div>
                <div className="p-2 rounded-full hover:bg-surface-highlight transition-colors cursor-pointer text-text-secondary">
                    <Info size={20}/>
                </div>
            </div>

            {/* --- MESSAGES LIST --- */}
            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar flex flex-col">
                {hasMore && (
                    <div className="flex justify-center my-4">
                        <button 
                            onClick={loadMore} 
                            disabled={loading}
                            className="text-xs text-primary font-medium hover:underline bg-surface-highlight/50 px-3 py-1 rounded-full"
                        >
                            {loading ? "Loading..." : "Load older messages"}
                        </button>
                    </div>
                )}
                
                {loading && !messages.length && (
                    <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-primary"/></div>
                )}

                {!loading && !messages.length && (
                     <div className="flex flex-col items-center justify-center flex-1 text-center px-8 mt-20">
                         <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mb-4">
                            <Send size={24} className="text-primary ml-1"/>
                         </div>
                         <h3 className="text-xl font-bold text-text-primary mb-1">Start a conversation</h3>
                         <p className="text-text-secondary text-sm">Say hello to {receiverUser?.name || receiverUser?.username}!</p>
                     </div>
                )}

                <div className="flex-1 flex flex-col justify-end min-h-0">
                    {messages.map((msg, i) => {
                         const isMe = msg.sender === currentUserId || msg.sender?._id === currentUserId;
                         const isConsecutive = i > 0 && messages[i-1].sender?._id === msg.sender?._id;
                         
                         return (
                             <MessageBubble 
                                key={msg._id || i}
                                message={msg}
                                isSentByCurrentUser={isMe}
                                showAvatar={!isConsecutive && !isMe}
                                isConsecutiveMessage={isConsecutive}
                                receiverUser={receiverUser}
                                onDelete={setMsgToDelete}
                                formatTime={formatTime}
                             />
                         );
                    })}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {/* --- INPUT AREA --- */}
            <div className="p-3 px-4 bg-surface border-t border-surface-highlight shrink-0">
                {previewImage && (
                    <div className="mb-3 relative inline-block animate-in fade-in zoom-in duration-200">
                        <img src={previewImage} className="h-40 rounded-2xl border border-surface-highlight shadow-md object-cover" alt="preview"/>
                        <button 
                            onClick={() => {setImageFile(null); setPreviewImage(null);}}
                            className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black transition-colors"
                        >
                            <X size={14}/>
                        </button>
                    </div>
                )}
                
                <div className="flex items-center gap-2 bg-surface-highlight rounded-3xl px-1 py-1 pr-2 shadow-sm border border-transparent focus-within:border-primary/20 focus-within:bg-background focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-full text-primary hover:bg-surface-highlight transition-colors flex items-center justify-center">
                       <ImageIcon size={20}/>
                    </button>
                    <input 
                        ref={fileInputRef} hidden type="file" accept="image/*" onChange={handleImageSelect}
                    />
                    
                     <button onClick={() => setShowEmoji(!showEmoji)} className="p-2.5 rounded-full text-primary hover:bg-surface-highlight transition-colors flex items-center justify-center relative">
                        <Smile size={20} />
                    </button>

                    {showEmoji && (
                        <div className="absolute bottom-[70px] left-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-surface-highlight">
                            <EmojiPicker onEmojiClick={(e) => {
                                setMessageText(prev => prev + e.emoji); 
                                setShowEmoji(false);
                            }} />
                        </div>
                    )}
                    
                    <input
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Start a new message"
                        className="flex-1 bg-transparent border-none focus:ring-0 py-2.5 px-2 text-[15px] text-text-primary placeholder:text-text-secondary outline-none min-w-0"
                    />

                    <button 
                        onClick={handleSend}
                        disabled={sending || (!messageText.trim() && !imageFile)}
                        className={`p-2 rounded-full flex items-center justify-center transition-all duration-200
                            ${sending || (!messageText.trim() && !imageFile) 
                                ? "opacity-50 cursor-not-allowed text-primary" 
                                : "text-primary hover:bg-primary/10"}
                        `}
                    >
                        {sending ? <Loader2 size={20} className="animate-spin"/> : <Send size={20} className={(!messageText.trim() && !imageFile) ? "ml-0" : "ml-0.5" }/>}
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
                <div className="p-4 pt-0 text-center">
                    <p className="text-text-secondary mb-6 text-sm">Are you sure you want to delete this message? This cannot be undone.</p>
                    <div className="flex flex-col gap-3">
                         <button onClick={confirmDelete} className="w-full py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold transition-colors">Delete</button>
                         <button onClick={() => setMsgToDelete(null)} className="w-full py-2.5 rounded-full border border-surface-highlight hover:bg-surface-highlight text-text-primary font-medium transition-colors">Cancel</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MessageDetail;
