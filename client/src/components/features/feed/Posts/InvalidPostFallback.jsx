import { AlertCircle } from "lucide-react";

const InvalidPostFallback = ({ message }) => (
  <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <AlertCircle size={20} className="text-neutral-400" />
      </div>
      <div className="flex-1">
        <div className="h-4 w-32 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
        <div className="h-3 w-20 bg-neutral-100 dark:bg-neutral-800 rounded-full mt-2" />
      </div>
    </div>
    {message && <div className="mt-3 text-sm text-red-500">{message}</div>}
  </div>
);

export default InvalidPostFallback;
