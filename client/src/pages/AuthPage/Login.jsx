import { useState, useRef, useCallback, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { login, googleAuth } from "@/redux/actions/authActions";
import { clearError } from "@/redux/slices/AuthSlice";
import toast from "react-hot-toast";

const Login = () => {
  const dispatch = useDispatch();
  const googleButtonRef = useRef(null);
  const googleInitialized = useRef(false);
  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Initialize Google Sign-In
  const initGoogle = useCallback(() => {
    if (
      googleInitialized.current ||
      !window.google?.accounts?.id ||
      !googleButtonRef.current
    ) {
      return;
    }

    googleInitialized.current = true;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        if (response.credential) {
          const result = await dispatch(
            googleAuth({ credential: response.credential })
          );
          if (googleAuth.fulfilled.match(result)) {
            toast.success("Đăng nhập Google thành công!");
          } else {
            toast.error("Đăng nhập Google thất bại");
          }
        }
      },
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "continue_with",
      shape: "pill",
    });
  }, [dispatch]);

  // Setup Google button when ref is available
  useEffect(() => {
    if (!googleButtonRef.current) return;

    // Try immediately
    initGoogle();

    // If not available, poll for it
    if (!googleInitialized.current) {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGoogle();
          clearInterval(interval);
        }
      }, 200);

      const timeout = setTimeout(() => clearInterval(interval), 10000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [initGoogle]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    const result = await dispatch(login(formData));
    if (login.fulfilled.match(result)) {
      toast.success("Đăng nhập thành công!");
    }
  };

  // Redirect if already authenticated AND user data is loaded
  if (isAuthenticated && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-black items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-900 to-black" />

        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/3 rounded-full blur-3xl" />

        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-8">
            <Sparkles size={28} className="text-black" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            YiBu
          </h1>
          <p className="text-white/60 text-lg max-w-sm mx-auto">
            Connect, share, and discover. Your social experience reimagined.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-black">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-10">
            <div className="w-12 h-12 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <Sparkles size={22} className="text-white dark:text-black" />
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-content dark:text-white mb-2">
              Welcome back
            </h2>
            <p className="text-neutral-500">Sign in to continue to YiBu</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-content dark:text-white">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-content dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-content dark:text-white">
                  Password
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-content dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center my-8">
              <div className="flex-1 border-t border-neutral-200 dark:border-neutral-800" />
              <span className="px-4 text-sm text-neutral-400">or</span>
              <div className="flex-1 border-t border-neutral-200 dark:border-neutral-800" />
            </div>

            {/* Google Sign-In Button */}
            <div className="flex justify-center">
              <div ref={googleButtonRef} />
            </div>
          </form>

          {/* Footer */}
          <p className="mt-10 text-center text-neutral-500">
            Don't have an account?{" "}
            <Link
              to="/auth/register"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
