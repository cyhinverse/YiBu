import { Toaster } from 'react-hot-toast';

const baseToastClass =
  'border-0 rounded-xl shadow-xl px-4 py-3 text-sm bg-white text-neutral-900';

const successToastClass =
  'border-0 rounded-xl shadow-xl px-4 py-3 text-sm bg-emerald-50 text-emerald-900';

const errorToastClass =
  'border-0 rounded-xl shadow-xl px-4 py-3 text-sm bg-red-50 text-red-900';

const AppToaster = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        className: baseToastClass,
        success: { className: successToastClass },
        error: { className: errorToastClass },
      }}
    />
  );
};

export default AppToaster;

