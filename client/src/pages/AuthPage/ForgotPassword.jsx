import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Sparkles, Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { requestPasswordReset } from "../../redux/actions/authActions";
import { clearError } from "../../redux/slices/AuthSlice";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email");
      return;
    }
    const result = await dispatch(requestPasswordReset(email));
    if (requestPasswordReset.fulfilled.match(result)) {
      setSent(true);
      toast.success("Đã gửi link đặt lại mật khẩu!");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-black items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-900 to-black" />

        <div className="absolute bottom-32 left-32 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-32 right-32 w-80 h-80 bg-white/3 rounded-full blur-3xl" />

        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-8">
            <Sparkles size={28} className="text-black" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Reset
          </h1>
          <p className="text-white/60 text-lg max-w-sm mx-auto">
            Don't worry, we'll help you get back into your account.
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

          {!sent ? (
            <>
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-black dark:text-white mb-2">
                  Forgot password?
                </h2>
                <p className="text-neutral-500">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black dark:text-white">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-black dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mx-auto mb-6">
                <Mail size={28} className="text-black dark:text-white" />
              </div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
                Check your email
              </h2>
              <p className="text-neutral-500 mb-8">
                We've sent a password reset link to <br />
                <span className="text-black dark:text-white font-medium">
                  {email}
                </span>
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
              >
                Didn't receive it? Try again
              </button>
            </div>
          )}

          {/* Back to login */}
          <div className="mt-10 text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
