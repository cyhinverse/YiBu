import { useState } from 'react';
import { X, AlertTriangle, Flag, Loader2, Check } from 'lucide-react';
import { useSubmitReport } from '@/hooks/useReportQuery';
import toast from 'react-hot-toast';
import { REPORT_REASONS } from '@/constants/report';

const ReportModal = ({
  isOpen,
  onClose,
  targetId,
  targetType = 'post', // 'post' | 'comment' | 'user' | 'message'
}) => {
  const { mutateAsync: submitReport, isPending: loading } = useSubmitReport();
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    try {
      const reasonLabel =
        REPORT_REASONS.find(r => r.id === selectedReason)?.label ||
        selectedReason;

      await submitReport({
        targetId,
        targetType,
        category: selectedReason,
        reason: reasonLabel,
        description: description.trim(),
      });

      setSubmitted(true);
      toast.success('Report submitted successfully');

      // Close modal after showing success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to submit report');
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDescription('');
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  const getTargetLabel = () => {
    switch (targetType) {
      case 'post':
        return 'post';
      case 'comment':
        return 'comment';
      case 'user':
        return 'user';
      case 'message':
        return 'message';
      default:
        return 'content';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-red-500" />
            <h2 className="text-base font-semibold text-black dark:text-white">
              Report {getTargetLabel()}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} className="text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <Check size={32} className="text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Report Submitted
            </h3>
            <p className="text-sm text-neutral-500 text-center px-6">
              Thank you for helping keep our community safe. We'll review your
              report and take appropriate action.
            </p>
          </div>
        ) : (
          <>
            {/* Warning */}
            <div className="mx-4 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex gap-2">
                <AlertTriangle
                  size={18}
                  className="text-amber-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Reports are reviewed by our moderation team. False reports may
                  result in action against your account.
                </p>
              </div>
            </div>

            {/* Reasons */}
            <div className="p-4">
              <p className="text-sm font-medium text-black dark:text-white mb-3">
                Why are you reporting this {getTargetLabel()}?
              </p>
              <div className="space-y-2 max-h-[35vh] overflow-y-auto">
                {REPORT_REASONS.map(reason => (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedReason === reason.id
                        ? 'bg-neutral-100 dark:bg-neutral-800 border-2 border-primary'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedReason === reason.id
                          ? 'border-primary bg-primary'
                          : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      {selectedReason === reason.id && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-black dark:text-white text-sm">
                        {reason.label}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {reason.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Additional description */}
              {selectedReason && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-black dark:text-white mb-2 block">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Provide any additional context..."
                    className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-black dark:text-white placeholder:text-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-neutral-400 mt-1 text-right">
                    {description.length}/500
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-black dark:text-white text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedReason || loading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  selectedReason && !loading
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Flag size={16} />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
