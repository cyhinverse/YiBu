import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { resetPassword } from "../../redux/actions/authActions";
import { clearError } from "../../redux/slices/AuthSlice";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast.error("Link đặt lại mật khẩu không hợp lệ");
      navigate("/auth/forgot-password");
    }
  }, [token, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return false;
    }
    if (formData.newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await dispatch(
      resetPassword({ token, newPassword: formData.newPassword })
    );
    if (resetPassword.fulfilled.match(result)) {
      setSuccess(true);
      toast.success("Đặt lại mật khẩu thành công!");
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
            New Password
          </h1>
          <p className="text-white/60 text-lg max-w-sm mx-auto">
            Create a strong password to keep your account secure.
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

          {!success ? (
            <>
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-black dark:text-white mb-2">
                  Đặt lại mật khẩu
                </h2>
                <p className="text-neutral-500">
                  Nhập mật khẩu mới cho tài khoản của bạn.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black dark:text-white">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full pl-12 pr-12 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-black dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black dark:text-white">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full pl-12 pr-12 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-black dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="text-xs text-neutral-500 space-y-1">
                  <p>Mật khẩu phải:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li
                      className={
                        formData.newPassword.length >= 6 ? "text-green-500" : ""
                      }
                    >
                      Có ít nhất 6 ký tự
                    </li>
                    <li
                      className={
                        formData.newPassword === formData.confirmPassword &&
                        formData.confirmPassword
                          ? "text-green-500"
                          : ""
                      }
                    >
                      Khớp với mật khẩu xác nhận
                    </li>
                  </ul>
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
                    "Đặt lại mật khẩu"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle
                  size={28}
                  className="text-green-600 dark:text-green-400"
                />
              </div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
                Thành công!
              </h2>
              <p className="text-neutral-500 mb-8">
                Mật khẩu của bạn đã được đặt lại thành công.
                <br />
                Bạn có thể đăng nhập với mật khẩu mới.
              </p>
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-black dark:bg-white text-white dark:text-black font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                Đăng nhập ngay
              </Link>
            </div>
          )}

          {/* Back to login */}
          {!success && (
            <div className="mt-10 text-center">
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                Quay lại đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
