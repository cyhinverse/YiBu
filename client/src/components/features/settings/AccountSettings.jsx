import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  User,
  Mail,
  Lock,
  Shield,
  Trash2,
  LogOut,
  Monitor,
} from 'lucide-react';
import {
  logout,
  logoutAll,
  updatePassword,
} from '../../../redux/actions/authActions';
import toast from 'react-hot-toast';

const AccountSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProfile } = useSelector(state => state.user);

  const [account, setAccount] = useState({
    email: 'johndoe@example.com',
    username: 'johndoe',
    phone: '',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    const result = await dispatch(logout());
    if (logout.fulfilled.match(result)) {
      toast.success('Đăng xuất thành công');
      navigate('/auth/login');
    }
  };

  const handleLogoutAll = async () => {
    const result = await dispatch(logoutAll());
    if (logoutAll.fulfilled.match(result)) {
      toast.success('Đã đăng xuất khỏi tất cả thiết bị');
      navigate('/auth/login');
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    const result = await dispatch(
      updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
    );
    setLoading(false);

    if (updatePassword.fulfilled.match(result)) {
      toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      navigate('/auth/login');
    }
  };

  const InputField = ({
    icon: Icon,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-black dark:text-white">
        {label}
      </label>
      <div className="relative">
        <Icon
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
          Account
        </h1>
        <p className="text-neutral-500 text-sm">
          Manage your account information and security
        </p>
      </div>

      {/* Account Info */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <User size={16} className="text-neutral-500" />
            <h3 className="text-sm font-medium text-black dark:text-white">
              Account Information
            </h3>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <InputField
            icon={User}
            label="Username"
            value={currentProfile.username}
            onChange={e => setAccount({ ...account, username: e.target.value })}
            placeholder="Enter username"
          />
          <InputField
            icon={Mail}
            label="Email"
            type="email"
            value={currentProfile.email}
            onChange={e => setAccount({ ...account, email: e.target.value })}
            placeholder="Enter email"
          />
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-neutral-500" />
            <h3 className="text-sm font-medium text-black dark:text-white">
              Security
            </h3>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-neutral-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-black dark:text-white">
                  Change Password
                </p>
                <p className="text-xs text-neutral-500">
                  Update your password regularly for security
                </p>
              </div>
            </div>
            <span className="text-xs text-neutral-400">→</span>
          </button>

          <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-neutral-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-black dark:text-white">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-neutral-500">
                  Add an extra layer of security
                </p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-500">
              Off
            </span>
          </button>
        </div>
      </div>

      {/* Session Management */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Monitor size={16} className="text-neutral-500" />
            <h3 className="text-sm font-medium text-black dark:text-white">
              Sessions
            </h3>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} className="text-neutral-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-black dark:text-white">
                  Logout
                </p>
                <p className="text-xs text-neutral-500">
                  Sign out from this device
                </p>
              </div>
            </div>
            <span className="text-xs text-neutral-400">→</span>
          </button>

          <button
            onClick={handleLogoutAll}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Monitor size={18} className="text-red-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-black dark:text-white">
                  Logout from all devices
                </p>
                <p className="text-xs text-neutral-500">
                  Sign out from all your active sessions
                </p>
              </div>
            </div>
            <span className="text-xs text-neutral-400">→</span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 overflow-hidden">
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900/50">
          <div className="flex items-center gap-2">
            <Trash2 size={16} className="text-red-500" />
            <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
              Danger Zone
            </h3>
          </div>
        </div>
        <div className="p-4">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Delete Account
          </button>
          <p className="text-xs text-neutral-500 mt-2 text-center">
            This action cannot be undone. All your data will be permanently
            deleted.
          </p>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-sm mx-4 bg-white dark:bg-neutral-900 rounded-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-black dark:text-white mb-2">
              Delete Account?
            </h3>
            <p className="text-sm text-neutral-500 mb-6">
              Are you sure you want to delete your account? This action cannot
              be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-black dark:text-white text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="w-full max-w-md mx-4 bg-white dark:bg-neutral-900 rounded-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-black dark:text-white mb-4">
              Đổi mật khẩu
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black dark:text-white">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={e =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black dark:text-white">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={e =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black dark:text-white">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={e =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
                className="flex-1 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-black dark:text-white text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdatePassword}
                disabled={loading}
                className="flex-1 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                ) : (
                  'Xác nhận'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
