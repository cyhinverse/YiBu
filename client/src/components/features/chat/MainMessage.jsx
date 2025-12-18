import { MessageCircle, Send } from 'lucide-react';

const MainMessage = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-neutral-950">
      <div className="max-w-sm animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-blue-500/10">
          <MessageCircle size={48} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-3xl font-black text-black dark:text-white mb-4 tracking-tight">
          Tin nhắn của bạn
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-10 leading-relaxed font-medium">
          Gửi ảnh và tin nhắn riêng tư cho bạn bè hoặc nhóm chat. Hãy bắt đầu kết nối ngay bây giờ!
        </p>
        <button
          onClick={() => {
            // This could open a search or suggest users
             window.dispatchEvent(new CustomEvent('open-new-chat'));
          }}
          className="group relative px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/25 flex items-center gap-3 mx-auto"
        >
          <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          <span>Gửi tin nhắn mới</span>
        </button>
      </div>
      
      {/* Decorative patterns or suggestions could go here */}
      <div className="absolute bottom-12 text-[10px] font-bold text-neutral-300 dark:text-neutral-800 uppercase tracking-widest pointer-events-none">
        Mã hóa đầu cuối & Bảo mật tuyệt đối
      </div>
    </div>
  );
};

export default MainMessage;
