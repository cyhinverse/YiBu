import { MessageCircle, Send } from 'lucide-react';

const MainMessage = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white dark:bg-neutral-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="max-w-md w-full relative z-10">
        <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">
          {/* Floating Icon Container */}
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-primary/20 dark:bg-primary/10 blur-3xl rounded-full scale-150 animate-pulse" />
            <div className="relative w-24 h-24 bg-white dark:bg-neutral-900 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-neutral-200/50 dark:shadow-neutral-900/50 border border-neutral-100 dark:border-neutral-800 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <MessageCircle size={40} className="text-black dark:text-white" />

              {/* Decorative Elements */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center border-4 border-white dark:border-neutral-950">
                <div className="w-2.5 h-2.5 bg-black dark:bg-white rounded-full animate-bounce" />
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-black text-black dark:text-white mb-3 tracking-tight">
            Tin nhắn của bạn
          </h2>

          <p className="text-neutral-500 dark:text-neutral-400 mb-10 leading-relaxed font-medium max-w-xs mx-auto">
            Gửi ảnh và tin nhắn riêng tư cho bạn bè hoặc nhóm chat. Hãy bắt đầu
            kết nối ngay bây giờ!
          </p>

          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-new-chat'));
            }}
            className="group relative px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-neutral-200/50 dark:shadow-none flex items-center gap-3"
          >
            <span>Gửi tin nhắn mới</span>
            <Send
              size={18}
              className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
            />
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-300 dark:text-neutral-700">
          Mã hóa đầu cuối & Bảo mật tuyệt đối
        </p>
      </div>
    </div>
  );
};

export default MainMessage;
