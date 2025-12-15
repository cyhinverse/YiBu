import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  AtSign,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { register } from "../../redux/actions/authActions";
import { clearError } from "../../redux/slices/AuthSlice";
import toast from "react-hot-toast";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (
      !formData.name ||
      !formData.username ||
      !formData.email ||
      !formData.password
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return false;
    }
    if (formData.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast.error("Username chỉ được chứa chữ cái, số và dấu gạch dưới");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await dispatch(register(formData));
    if (register.fulfilled.match(result)) {
      toast.success("Đăng ký thành công!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-black items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-900 to-black" />

        {/* Decorative circles */}
        <div className="absolute top-40 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-white/3 rounded-full blur-3xl" />

        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-8">
            <Sparkles size={28} className="text-black" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Join YiBu
          </h1>
          <p className="text-white/60 text-lg max-w-sm mx-auto">
            Create your account and start connecting with people around the
            world.
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
            <h2 className="text-3xl font-bold text-black dark:text-white mb-2">
              Create account
            </h2>
            <p className="text-neutral-500">
              Free forever. No credit card needed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name & Username row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black dark:text-white">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-black dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black dark:text-white">
                  Username
                </label>
                <div className="relative">
                  <AtSign
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="johndoe"
                    className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-black dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-black dark:text-white">
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
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-black dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-black dark:text-white">
                Password
              </label>
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
                  placeholder="Create a strong password"
                  className="w-full pl-12 pr-12 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-black dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-primary transition-colors text-sm"
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

            {/* Terms */}
            <p className="text-xs text-neutral-500">
              By creating an account, you agree to our{" "}
              <Link
                to="#"
                className="text-black dark:text-white hover:underline"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                to="#"
                className="text-black dark:text-white hover:underline"
              >
                Privacy Policy
              </Link>
            </p>

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
                "Create Account"
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center my-6">
              <div className="flex-1 border-t border-neutral-200 dark:border-neutral-800" />
              <span className="px-4 text-sm text-neutral-400">or</span>
              <div className="flex-1 border-t border-neutral-200 dark:border-neutral-800" />
            </div>

            {/* Social Login */}
            <button
              type="button"
              className="w-full py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-neutral-500">
            Already have an account?{" "}
            <Link
              to="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
