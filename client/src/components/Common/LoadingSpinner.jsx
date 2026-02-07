import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({
  fullScreen = false,
  size = 'md',
  className = '',
  text = '',
}) => {
  const sizeMap = {
    xs: 14,
    sm: 20,
    md: 32,
    lg: 48,
    xl: 64,
  };

  const spinnerContent = (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <Loader2 size={sizeMap[size]} className="animate-spin text-neutral-400" />
      {text && <p className="text-neutral-500 text-sm font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;
