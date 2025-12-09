import { useState } from "react";
import { Save, Flag, X, Trash, EyeOff, Link2 } from "lucide-react";

const PostOption = ({ show, onClose }) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(!isSaved);
    onClose?.();
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleReportSubmit = () => {
    // Simulate report submission
    setShowReportModal(false);
    setReportReason("");
    onClose?.();
  };

  const handleHide = () => {
    onClose?.();
  };

  const handleCopyLink = () => {
    onClose?.();
  };

  if (!show) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm mx-4 bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-200 dark:border-neutral-800"
          >
            <Save size={18} className="text-neutral-500" />
            <span className="text-black dark:text-white text-sm">
              {isSaved ? "Unsave post" : "Save post"}
            </span>
          </button>

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-200 dark:border-neutral-800"
          >
            <Link2 size={18} className="text-neutral-500" />
            <span className="text-black dark:text-white text-sm">
              Copy link
            </span>
          </button>

          {/* Hide */}
          <button
            onClick={handleHide}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-200 dark:border-neutral-800"
          >
            <EyeOff size={18} className="text-neutral-500" />
            <span className="text-black dark:text-white text-sm">
              Hide post
            </span>
          </button>

          {/* Report */}
          <button
            onClick={handleReport}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-200 dark:border-neutral-800"
          >
            <Flag size={18} className="text-red-500" />
            <span className="text-red-500 text-sm">Report post</span>
          </button>

          {/* Cancel */}
          <button
            onClick={onClose}
            className="w-full px-4 py-3.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <span className="text-neutral-500 text-sm">Cancel</span>
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="w-full max-w-md mx-4 bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold text-black dark:text-white">
                Report post
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={18} className="text-neutral-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-neutral-500 mb-3">
                Why are you reporting this post?
              </p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the issue..."
                className="w-full h-24 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-black dark:text-white text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                className="flex-1 px-4 py-2.5 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostOption;
