import { Link } from "react-router-dom";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-black px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Number */}
        <h1 className="text-[150px] font-black leading-none text-black dark:text-white">
          404
        </h1>

        {/* Icon */}
        <div className="flex justify-center -mt-6 mb-6">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border-4 border-neutral-50 dark:border-black">
            <Search size={28} className="text-neutral-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get
          you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            <Home size={18} />
            <span>Go Home</span>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white rounded-full font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 mb-4">Quick links</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Feed", path: "/feed" },
              { label: "Messages", path: "/messages" },
              { label: "Profile", path: "/profile" },
              { label: "Settings", path: "/settings" },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-neutral-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-neutral-500/5 rounded-full blur-3xl" />
    </div>
  );
};

export default NotFound;
