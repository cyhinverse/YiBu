import { useState } from 'react';
import { Camera, User, FileText, Link2, MapPin } from 'lucide-react';
import { useSelector } from 'react-redux';

// Fake user data
const FAKE_USER = {
  name: 'John Doe',
  username: 'johndoe',
  bio: 'Software Developer | Tech Enthusiast | Coffee Lover ☕',
  website: 'https://johndoe.dev',
  location: 'San Francisco, CA',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe',
  cover: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800',
};

const ProfileSettings = () => {
  const [profile, setProfile] = useState(FAKE_USER);
  const [isSaving, setIsSaving] = useState(false);
  const { currentProfile } = useSelector(state => state.user);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const InputField = ({
    icon: Icon,
    label,
    value,
    onChange,
    placeholder,
    multiline = false,
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-black dark:text-white">
        {label}
      </label>
      <div className="relative">
        {!multiline && (
          <Icon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
        )}
        {multiline ? (
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
          Edit Profile
        </h1>
        <p className="text-neutral-500 text-sm">
          Update your profile information
        </p>
      </div>

      {/* Cover & Avatar */}
      <div className="space-y-4">
        {/* Cover */}
        <div className="relative h-32 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <img
            src={profile.cover}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <button className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
            <Camera size={24} className="text-white" />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex items-end gap-4 -mt-12 ml-4">
          <div className="relative">
            <img
              src={currentProfile.avatar}
              alt={currentProfile.username}
              className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-neutral-900"
            />
            <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </button>
          </div>
          <button className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
            Change Photo
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <InputField
          icon={User}
          label="Name"
          value={currentProfile.username}
          onChange={e => setProfile({ ...profile, name: e.target.value })}
          placeholder="Your name"
        />
        <InputField
          icon={User}
          label="Username"
          value={currentProfile.username}
          onChange={e => setProfile({ ...profile, username: e.target.value })}
          placeholder="Your username"
        />
        <InputField
          icon={FileText}
          label="Bio"
          value={currentProfile.bio}
          onChange={e => setProfile({ ...profile, bio: e.target.value })}
          placeholder="Tell us about yourself"
          multiline
        />
        <InputField
          icon={Link2}
          label="Website"
          value={
            currentProfile.website ? currentProfile.website : 'Chưa có website'
          }
          onChange={e => setProfile({ ...profile, website: e.target.value })}
          placeholder="https://yourwebsite.com"
        />
        <InputField
          icon={MapPin}
          label="Location"
          value={
            currentProfile.location
              ? currentProfile.location
              : 'Chưa có địa chỉ'
          }
          onChange={e => setProfile({ ...profile, location: e.target.value })}
          placeholder="Where are you based?"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
