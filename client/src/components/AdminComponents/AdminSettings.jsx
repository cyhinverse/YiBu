import React, { useState } from "react";
import {
  Save,
  Check,
  Shield,
  UserCog,
  Settings,
  Bell,
  FileText,
  Globe,
  Mail,
  MessageSquare,
  XCircle,
  ThumbsUp,
} from "lucide-react";

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "YiBu Social Network",
    siteDescription: "Mạng xã hội chia sẻ và kết nối người dùng",
    contactEmail: "contact@yibu.com",
    supportEmail: "support@yibu.com",
    maxUploadSize: 5, // MB
    languageDefault: "vi",
    timeZone: "Asia/Ho_Chi_Minh",
    resultsPerPage: 10,
  });

  const [userSettings, setUserSettings] = useState({
    allowRegistrations: true,
    requireEmailVerification: true,
    requireApproval: false,
    defaultUserRole: "user",
    allowUserDeletion: true,
    autoDeleteInactive: false,
    inactiveDuration: 365, // days
    maxLoginAttempts: 5,
    lockoutDuration: 30, // minutes
  });

  const [contentSettings, setContentSettings] = useState({
    allowComments: true,
    moderateFirstComment: true,
    moderateAllContent: false,
    allowEditingComments: true,
    commentEditWindow: 60, // minutes
    allowFileUploads: true,
    allowedFileTypes: "jpg,jpeg,png,gif,pdf,doc,docx",
    enableProfanityFilter: true,
    profanityAction: "replace", // replace, censor, reject
  });

  const [notificationSettings, setNotificationSettings] = useState({
    enableEmails: true,
    emailDigestFrequency: "daily",
    sendCommentNotifications: true,
    sendLikeNotifications: true,
    sendMentionNotifications: true,
    sendAdminNotifications: true,
    enableBrowserNotifications: true,
    notifyOnNewUser: true,
    notifyOnReports: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    enableTwoFactor: false,
    requireStrongPasswords: true,
    passwordMinLength: 8,
    sessionTimeout: 60, // minutes
    enableCaptcha: true,
    captchaType: "recaptcha",
    ipBlocking: true,
    maxRequestsPerMinute: 100,
    enableSSL: true,
    enableCORS: true,
  });

  const handleSaveSettings = () => {
    // Simulated API call to save settings
    // In a real app, you would call an API here
    console.log("Saving settings:", {
      generalSettings,
      userSettings,
      contentSettings,
      notificationSettings,
      securitySettings,
    });

    // Show success message
    alert("Cài đặt đã được lưu thành công!");
  };

  const renderGeneral = () => (
    <div className="space-y-6">
      <SettingGroup title="Cài đặt trang web">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="Tên trang web"
            value={generalSettings.siteName}
            onChange={(value) =>
              setGeneralSettings({ ...generalSettings, siteName: value })
            }
          />
          <FormInput
            label="Mô tả trang web"
            value={generalSettings.siteDescription}
            onChange={(value) =>
              setGeneralSettings({ ...generalSettings, siteDescription: value })
            }
          />
        </div>
      </SettingGroup>

      <SettingGroup title="Thông tin liên hệ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="Email liên hệ"
            value={generalSettings.contactEmail}
            onChange={(value) =>
              setGeneralSettings({ ...generalSettings, contactEmail: value })
            }
            type="email"
          />
          <FormInput
            label="Email hỗ trợ"
            value={generalSettings.supportEmail}
            onChange={(value) =>
              setGeneralSettings({ ...generalSettings, supportEmail: value })
            }
            type="email"
          />
        </div>
      </SettingGroup>

      <SettingGroup title="Cài đặt hiển thị">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormSelect
            label="Ngôn ngữ mặc định"
            value={generalSettings.languageDefault}
            onChange={(value) =>
              setGeneralSettings({ ...generalSettings, languageDefault: value })
            }
            options={[
              { value: "vi", label: "Tiếng Việt" },
              { value: "en", label: "Tiếng Anh" },
            ]}
          />
          <FormSelect
            label="Múi giờ"
            value={generalSettings.timeZone}
            onChange={(value) =>
              setGeneralSettings({ ...generalSettings, timeZone: value })
            }
            options={[
              { value: "Asia/Ho_Chi_Minh", label: "Việt Nam (GMT+7)" },
              { value: "Asia/Bangkok", label: "Thái Lan (GMT+7)" },
              { value: "Asia/Tokyo", label: "Nhật Bản (GMT+9)" },
              { value: "America/New_York", label: "New York (GMT-5)" },
            ]}
          />
          <FormInput
            label="Kích thước tải lên tối đa (MB)"
            value={generalSettings.maxUploadSize.toString()}
            onChange={(value) =>
              setGeneralSettings({
                ...generalSettings,
                maxUploadSize: parseInt(value) || 5,
              })
            }
            type="number"
          />
          <FormInput
            label="Số kết quả mỗi trang"
            value={generalSettings.resultsPerPage.toString()}
            onChange={(value) =>
              setGeneralSettings({
                ...generalSettings,
                resultsPerPage: parseInt(value) || 10,
              })
            }
            type="number"
          />
        </div>
      </SettingGroup>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <SettingGroup title="Cài đặt đăng ký">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormToggle
            label="Cho phép đăng ký mới"
            checked={userSettings.allowRegistrations}
            onChange={(value) =>
              setUserSettings({ ...userSettings, allowRegistrations: value })
            }
          />
          <FormToggle
            label="Yêu cầu xác minh email"
            checked={userSettings.requireEmailVerification}
            onChange={(value) =>
              setUserSettings({
                ...userSettings,
                requireEmailVerification: value,
              })
            }
          />
          <FormToggle
            label="Yêu cầu phê duyệt đăng ký"
            checked={userSettings.requireApproval}
            onChange={(value) =>
              setUserSettings({ ...userSettings, requireApproval: value })
            }
          />
          <FormSelect
            label="Vai trò mặc định"
            value={userSettings.defaultUserRole}
            onChange={(value) =>
              setUserSettings({ ...userSettings, defaultUserRole: value })
            }
            options={[
              { value: "user", label: "Người dùng" },
              { value: "contributor", label: "Cộng tác viên" },
              { value: "editor", label: "Biên tập viên" },
            ]}
          />
        </div>
      </SettingGroup>

      <SettingGroup title="Quản lý tài khoản">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormToggle
            label="Cho phép người dùng xóa tài khoản"
            checked={userSettings.allowUserDeletion}
            onChange={(value) =>
              setUserSettings({ ...userSettings, allowUserDeletion: value })
            }
          />
          <FormToggle
            label="Tự động xóa tài khoản không hoạt động"
            checked={userSettings.autoDeleteInactive}
            onChange={(value) =>
              setUserSettings({ ...userSettings, autoDeleteInactive: value })
            }
          />
          {userSettings.autoDeleteInactive && (
            <FormInput
              label="Thời gian không hoạt động (ngày)"
              value={userSettings.inactiveDuration.toString()}
              onChange={(value) =>
                setUserSettings({
                  ...userSettings,
                  inactiveDuration: parseInt(value) || 365,
                })
              }
              type="number"
            />
          )}
        </div>
      </SettingGroup>

      <SettingGroup title="Cài đặt đăng nhập">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="Số lần đăng nhập sai tối đa"
            value={userSettings.maxLoginAttempts.toString()}
            onChange={(value) =>
              setUserSettings({
                ...userSettings,
                maxLoginAttempts: parseInt(value) || 5,
              })
            }
            type="number"
          />
          <FormInput
            label="Thời gian khóa đăng nhập (phút)"
            value={userSettings.lockoutDuration.toString()}
            onChange={(value) =>
              setUserSettings({
                ...userSettings,
                lockoutDuration: parseInt(value) || 30,
              })
            }
            type="number"
          />
        </div>
      </SettingGroup>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6">
      <SettingGroup title="Cài đặt bình luận">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormToggle
            label="Cho phép bình luận"
            checked={contentSettings.allowComments}
            onChange={(value) =>
              setContentSettings({ ...contentSettings, allowComments: value })
            }
          />
          <FormToggle
            label="Kiểm duyệt bình luận đầu tiên"
            checked={contentSettings.moderateFirstComment}
            onChange={(value) =>
              setContentSettings({
                ...contentSettings,
                moderateFirstComment: value,
              })
            }
          />
          <FormToggle
            label="Kiểm duyệt tất cả nội dung"
            checked={contentSettings.moderateAllContent}
            onChange={(value) =>
              setContentSettings({
                ...contentSettings,
                moderateAllContent: value,
              })
            }
          />
          <FormToggle
            label="Cho phép chỉnh sửa bình luận"
            checked={contentSettings.allowEditingComments}
            onChange={(value) =>
              setContentSettings({
                ...contentSettings,
                allowEditingComments: value,
              })
            }
          />
          {contentSettings.allowEditingComments && (
            <FormInput
              label="Thời gian cho phép chỉnh sửa (phút)"
              value={contentSettings.commentEditWindow.toString()}
              onChange={(value) =>
                setContentSettings({
                  ...contentSettings,
                  commentEditWindow: parseInt(value) || 60,
                })
              }
              type="number"
            />
          )}
        </div>
      </SettingGroup>

      <SettingGroup title="Cài đặt tệp tải lên">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormToggle
            label="Cho phép tải lên tệp"
            checked={contentSettings.allowFileUploads}
            onChange={(value) =>
              setContentSettings({
                ...contentSettings,
                allowFileUploads: value,
              })
            }
          />
          {contentSettings.allowFileUploads && (
            <FormInput
              label="Định dạng tệp cho phép (phân cách bởi dấu phẩy)"
              value={contentSettings.allowedFileTypes}
              onChange={(value) =>
                setContentSettings({
                  ...contentSettings,
                  allowedFileTypes: value,
                })
              }
            />
          )}
        </div>
      </SettingGroup>

      <SettingGroup title="Bộ lọc nội dung">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormToggle
            label="Bật bộ lọc từ ngữ không phù hợp"
            checked={contentSettings.enableProfanityFilter}
            onChange={(value) =>
              setContentSettings({
                ...contentSettings,
                enableProfanityFilter: value,
              })
            }
          />
          {contentSettings.enableProfanityFilter && (
            <FormSelect
              label="Hành động với từ ngữ không phù hợp"
              value={contentSettings.profanityAction}
              onChange={(value) =>
                setContentSettings({
                  ...contentSettings,
                  profanityAction: value,
                })
              }
              options={[
                { value: "replace", label: "Thay thế bằng dấu *" },
                { value: "censor", label: "Che mờ từ" },
                { value: "reject", label: "Từ chối bình luận" },
              ]}
            />
          )}
        </div>
      </SettingGroup>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <SettingGroup title="Cài đặt email">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormToggle
            label="Bật thông báo qua email"
            checked={notificationSettings.enableEmails}
            onChange={(value) =>
              setNotificationSettings({
                ...notificationSettings,
                enableEmails: value,
              })
            }
          />
          {notificationSettings.enableEmails && (
            <>
              <FormSelect
                label="Tần suất gửi bản tóm tắt"
                value={notificationSettings.emailDigestFrequency}
                onChange={(value) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    emailDigestFrequency: value,
                  })
                }
                options={[
                  { value: "daily", label: "Hàng ngày" },
                  { value: "weekly", label: "Hàng tuần" },
                  { value: "monthly", label: "Hàng tháng" },
                  { value: "never", label: "Không gửi" },
                ]}
              />
              <FormToggle
                label="Thông báo khi có bình luận mới"
                checked={notificationSettings.sendCommentNotifications}
                onChange={(value) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    sendCommentNotifications: value,
                  })
                }
              />
              <FormToggle
                label="Thông báo khi có lượt thích mới"
                checked={notificationSettings.sendLikeNotifications}
                onChange={(value) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    sendLikeNotifications: value,
                  })
                }
              />
              <FormToggle
                label="Thông báo khi được nhắc đến (@)"
                checked={notificationSettings.sendMentionNotifications}
                onChange={(value) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    sendMentionNotifications: value,
                  })
                }
              />
            </>
          )}
        </div>
      </SettingGroup>

      <SettingGroup title="Thông báo cho admin">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormToggle
            label="Bật thông báo cho admin"
            checked={notificationSettings.sendAdminNotifications}
            onChange={(value) =>
              setNotificationSettings({
                ...notificationSettings,
                sendAdminNotifications: value,
              })
            }
          />
          {notificationSettings.sendAdminNotifications && (
            <>
              <FormToggle
                label="Thông báo khi có người dùng mới"
                checked={notificationSettings.notifyOnNewUser}
                onChange={(value) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    notifyOnNewUser: value,
                  })
                }
              />
              <FormToggle
                label="Thông báo khi có báo cáo mới"
                checked={notificationSettings.notifyOnReports}
                onChange={(value) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    notifyOnReports: value,
                  })
                }
              />
            </>
          )}
        </div>
      </SettingGroup>

      <SettingGroup title="Thông báo trình duyệt">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormToggle
            label="Bật thông báo trên trình duyệt"
            checked={notificationSettings.enableBrowserNotifications}
            onChange={(value) =>
              setNotificationSettings({
                ...notificationSettings,
                enableBrowserNotifications: value,
              })
            }
          />
        </div>
      </SettingGroup>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <SettingGroup title="Bảo mật đăng nhập">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormToggle
            label="Bật xác thực hai yếu tố"
            checked={securitySettings.enableTwoFactor}
            onChange={(value) =>
              setSecuritySettings({
                ...securitySettings,
                enableTwoFactor: value,
              })
            }
          />
          <FormToggle
            label="Yêu cầu mật khẩu mạnh"
            checked={securitySettings.requireStrongPasswords}
            onChange={(value) =>
              setSecuritySettings({
                ...securitySettings,
                requireStrongPasswords: value,
              })
            }
          />
          <FormInput
            label="Độ dài tối thiểu của mật khẩu"
            value={securitySettings.passwordMinLength.toString()}
            onChange={(value) =>
              setSecuritySettings({
                ...securitySettings,
                passwordMinLength: parseInt(value) || 8,
              })
            }
            type="number"
          />
          <FormInput
            label="Thời gian hết hạn phiên (phút)"
            value={securitySettings.sessionTimeout.toString()}
            onChange={(value) =>
              setSecuritySettings({
                ...securitySettings,
                sessionTimeout: parseInt(value) || 60,
              })
            }
            type="number"
          />
        </div>
      </SettingGroup>

      <SettingGroup title="Bảo vệ SPAM">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormToggle
            label="Bật CAPTCHA"
            checked={securitySettings.enableCaptcha}
            onChange={(value) =>
              setSecuritySettings({ ...securitySettings, enableCaptcha: value })
            }
          />
          {securitySettings.enableCaptcha && (
            <FormSelect
              label="Loại CAPTCHA"
              value={securitySettings.captchaType}
              onChange={(value) =>
                setSecuritySettings({ ...securitySettings, captchaType: value })
              }
              options={[
                { value: "recaptcha", label: "Google reCAPTCHA" },
                { value: "hcaptcha", label: "hCaptcha" },
                { value: "simple", label: "Mã xác nhận đơn giản" },
              ]}
            />
          )}
          <FormToggle
            label="Chặn IP"
            checked={securitySettings.ipBlocking}
            onChange={(value) =>
              setSecuritySettings({ ...securitySettings, ipBlocking: value })
            }
          />
          <FormInput
            label="Số yêu cầu tối đa mỗi phút"
            value={securitySettings.maxRequestsPerMinute.toString()}
            onChange={(value) =>
              setSecuritySettings({
                ...securitySettings,
                maxRequestsPerMinute: parseInt(value) || 100,
              })
            }
            type="number"
          />
        </div>
      </SettingGroup>

      <SettingGroup title="Bảo mật kết nối">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormToggle
            label="Bắt buộc sử dụng SSL"
            checked={securitySettings.enableSSL}
            onChange={(value) =>
              setSecuritySettings({ ...securitySettings, enableSSL: value })
            }
          />
          <FormToggle
            label="Bật CORS"
            checked={securitySettings.enableCORS}
            onChange={(value) =>
              setSecuritySettings({ ...securitySettings, enableCORS: value })
            }
          />
        </div>
      </SettingGroup>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Cài Đặt Hệ Thống</h2>
        <button
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={handleSaveSettings}
        >
          <Save className="mr-2" size={16} />
          Lưu cài đặt
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <TabButton
            active={activeTab === "general"}
            onClick={() => setActiveTab("general")}
            icon={<Settings className="mr-2" size={16} />}
            label="Chung"
          />
          <TabButton
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
            icon={<UserCog className="mr-2" size={16} />}
            label="Người dùng"
          />
          <TabButton
            active={activeTab === "content"}
            onClick={() => setActiveTab("content")}
            icon={<FileText className="mr-2" size={16} />}
            label="Nội dung"
          />
          <TabButton
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
            icon={<Bell className="mr-2" size={16} />}
            label="Thông báo"
          />
          <TabButton
            active={activeTab === "security"}
            onClick={() => setActiveTab("security")}
            icon={<Shield className="mr-2" size={16} />}
            label="Bảo mật"
          />
        </nav>
      </div>

      {/* Tab content */}
      <div className="bg-white shadow-md rounded-lg p-6">
        {activeTab === "general" && renderGeneral()}
        {activeTab === "users" && renderUsers()}
        {activeTab === "content" && renderContent()}
        {activeTab === "notifications" && renderNotifications()}
        {activeTab === "security" && renderSecurity()}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
      active
        ? "border-blue-500 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`}
  >
    {icon}
    {label}
  </button>
);

const SettingGroup = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

const FormInput = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const FormSelect = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <select
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const FormToggle = ({ label, checked, onChange }) => (
  <div className="flex items-center">
    <button
      type="button"
      className={`${
        checked ? "bg-blue-600" : "bg-gray-200"
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span
        aria-hidden="true"
        className={`${
          checked ? "translate-x-5" : "translate-x-0"
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
    <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
  </div>
);

export default AdminSettings;
