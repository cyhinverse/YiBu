import { X, Plus } from "lucide-react";

const CommentHeader = ({ commentsCount, onAddComment, onClose }) => {
  return (
    <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
      <div className="flex items-center space-x-2">
        <span className="font-bold text-xl text-gray-800">Comments</span>
        <div className="bg-purple-100 text-purple-600 text-xs font-semibold px-2 py-1 rounded-full">
          {commentsCount}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          className="flex items-center space-x-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200"
          onClick={onAddComment}
        >
          <Plus size={16} />
          <span>Add Comment</span>
        </button>
        <button
          className="p-2 hover:bg-white/80 rounded-full transition-all duration-200 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default CommentHeader;
