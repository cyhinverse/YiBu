import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Shield,
  Smartphone,
  Key,
  Trash2,
  Monitor,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getSettings,
  updateSecuritySettings,
} from '../../../redux/actions/userActions';
import {
  enable2FA,
  verify2FA,
  disable2FA,
  getSessions,
  revokeSession,
} from '../../../redux/actions/authActions';

const SecuritySettings = () => {
  const dispatch = useDispatch();
  const { settings, loading } = useSelector(state => state.user);
  const { sessions } = useSelector(state => state.auth);

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    trustedDevicesOnly: false,
  });
  const [saving, setSaving] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Load settings on mount
  useEffect(() => {
    dispatch(getSettings());
    dispatch(getSessions());
  }, [dispatch]);

  // Sync local state with Redux state
  useEffect(() => {
    if (settings?.security) {
      setSecurity(prev => ({
        ...prev,
        ...settings.security,
      }));
    }
  }, [settings]);

  const handleSecurityChange = async (key, value) => {
    const newSecurity = { ...security, [key]: value };
    setSecurity(newSecurity);
    setSaving(true);

    try {
      await dispatch(updateSecuritySettings(newSecurity)).unwrap();
      toast.success('Đã lưu cài đặt bảo mật');
    } catch (error) {
      setSecurity(security); // Revert on failure
      toast.error(error || 'Lưu cài đặt thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const result = await dispatch(enable2FA()).unwrap();
      // Support both direct object and nested data response formats
      const qrCodeData = result.qrCode || result.data?.qrCode;
      setQrCode(qrCodeData);
      setShow2FAModal(true);
    } catch (error) {
      toast.error(error || 'Không thể bật 2FA');
    }
  };

  const handleVerify2FA = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error('Vui lòng nhập mã 6 số');
      return;
    }

    setVerifying(true);
    try {
      await dispatch(verify2FA({ token: verifyCode })).unwrap();
      toast.success('Đã bật xác thực hai yếu tố');
      setSecurity(prev => ({ ...prev, twoFactorEnabled: true }));
      setShow2FAModal(false);
      setVerifyCode('');
    } catch (error) {
      toast.error(error || 'Mã xác thực không hợp lệ');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Bạn có chắc muốn tắt xác thực hai yếu tố?')) return;

    try {
      await dispatch(disable2FA()).unwrap();
      toast.success('Đã tắt xác thực hai yếu tố');
      setSecurity(prev => ({ ...prev, twoFactorEnabled: false }));
    } catch (error) {
      toast.error(error || 'Không thể tắt 2FA');
    }
  };

  const handleRevokeSession = async sessionId => {
    if (!window.confirm('Bạn có chắc muốn đăng xuất phiên này?')) return;

    try {
      await dispatch(revokeSession(sessionId)).unwrap();
      toast.success('Đã đăng xuất phiên');
    } catch (error) {
      toast.error(error || 'Không thể đăng xuất phiên');
    }
  };

  const ToggleSwitch = ({
    enabled,
    onChange,
    label,
    description,
    disabled,
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-black dark:text-white">
          {label}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          enabled
            ? 'bg-black dark:bg-white'
            : 'bg-neutral-200 dark:bg-neutral-700'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
            enabled
              ? 'translate-x-5 bg-white dark:bg-black'
              : 'translate-x-0.5 bg-white dark:bg-neutral-400'
          }`}
        />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
          Bảo mật
        </h1>
        <p className="text-neutral-500 text-sm">
          Quản lý bảo mật tài khoản và thiết bị tin cậy
        </p>
      </div>

      {/* Two-Factor Authentication */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-neutral-500" />
            <h3 className="text-sm font-medium text-black dark:text-white">
              Xác thực hai yếu tố (2FA)
            </h3>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  security.twoFactorEnabled
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-neutral-100 dark:bg-neutral-800'
                }`}
              >
                {security.twoFactorEnabled ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-black dark:text-white">
                  {security.twoFactorEnabled ? 'Đã bật 2FA' : 'Chưa bật 2FA'}
                </p>
                <p className="text-xs text-neutral-500">
                  {security.twoFactorEnabled
                    ? 'Tài khoản của bạn được bảo vệ'
                    : 'Bật để tăng cường bảo mật'}
                </p>
              </div>
            </div>
            <button
              onClick={
                security.twoFactorEnabled ? handleDisable2FA : handleEnable2FA
              }
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                security.twoFactorEnabled
                  ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50'
                  : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-80'
              }`}
            >
              {security.twoFactorEnabled ? 'Tắt 2FA' : 'Bật 2FA'}
            </button>
          </div>
        </div>
      </div>

      {/* Security Options */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-neutral-500" />
            <h3 className="text-sm font-medium text-black dark:text-white">
              Tùy chọn bảo mật
            </h3>
          </div>
        </div>
        <div className="p-4">
          <ToggleSwitch
            enabled={security.loginAlerts}
            onChange={() =>
              handleSecurityChange('loginAlerts', !security.loginAlerts)
            }
            label="Cảnh báo đăng nhập"
            description="Nhận thông báo khi có đăng nhập từ thiết bị mới"
            disabled={saving}
          />
          <ToggleSwitch
            enabled={security.trustedDevicesOnly}
            onChange={() =>
              handleSecurityChange(
                'trustedDevicesOnly',
                !security.trustedDevicesOnly
              )
            }
            label="Chỉ thiết bị tin cậy"
            description="Chỉ cho phép đăng nhập từ thiết bị đã xác minh"
            disabled={saving}
          />
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Monitor size={16} className="text-neutral-500" />
            <h3 className="text-sm font-medium text-black dark:text-white">
              Phiên đăng nhập
            </h3>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {sessions && sessions.length > 0 ? (
            sessions.map(session => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-neutral-700">
                    {session.deviceType === 'mobile' ? (
                      <Smartphone className="w-4 h-4 text-neutral-500" />
                    ) : (
                      <Monitor className="w-4 h-4 text-neutral-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {session.browser} trên {session.os}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {session.ip} •{' '}
                      {session.isCurrent ? 'Thiết bị này' : session.lastActive}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Đăng xuất phiên này"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-500 text-center py-4">
              Không có phiên đăng nhập nào
            </p>
          )}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Thiết lập xác thực hai yếu tố
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Quét mã QR bằng ứng dụng xác thực (Google Authenticator, Authy,
                ...) rồi nhập mã xác nhận.
              </p>
              {qrCode && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Mã xác nhận
                </label>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={e =>
                    setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="Nhập mã 6 số"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white text-center text-lg tracking-widest"
                />
              </div>
            </div>
            <div className="p-4 flex gap-3 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => {
                  setShow2FAModal(false);
                  setVerifyCode('');
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                Hủy
              </button>
              <button
                onClick={handleVerify2FA}
                disabled={verifying || verifyCode.length !== 6}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-black dark:bg-white dark:text-black rounded-lg hover:opacity-80 disabled:opacity-50"
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
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

export default SecuritySettings;
