import { useState, useEffect, useRef } from 'react';
import {
  Camera,
  User,
  FileText,
  Link2,
  MapPin,
  Loader2,
  Map as MapIcon,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useProfile, useUpdateProfile } from '@/hooks/useUserQuery';
import toast from 'react-hot-toast';
import { Suspense, lazy } from 'react';

const LocationPickerModal = lazy(() =>
  import('@/components/common/LocationPickerModal')
);

const InputField = ({
  icon,
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rightElement = null,
}) => {
  const Icon = icon;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-content dark:text-white">
        {label}
      </label>
      <div className="relative">
        {!multiline && Icon && (
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
            className="w-full px-4 py-2.5 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/40 text-content dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full pl-10 ${
              rightElement ? 'pr-12' : 'pr-4'
            } py-2.5 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/40 text-content dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40`}
          />
        )}
        {rightElement && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileSettings = () => {
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const { user } = useSelector(state => state.auth);

  // React Query hooks
  const { data: currentProfile, isLoading: profileLoading } = useProfile(
    user?._id
  );
  const { mutate: updateProfileMutation } = useUpdateProfile();

  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  // Location Picker State
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    website: '',
    location: '',
  });

  // Update form when profile loads
  useEffect(() => {
    if (currentProfile) {
      setFormData({
        name: currentProfile.name || '',
        username: currentProfile.username || '',
        bio: currentProfile.bio || '',
        website: currentProfile.website || '',
        location: currentProfile.location || '',
      });
    }
  }, [currentProfile]);

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = e => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('username', formData.username);
      data.append('bio', formData.bio);
      data.append('website', formData.website);
      data.append('location', formData.location);

      if (avatarFile) {
        data.append('avatar', avatarFile);
      }
      if (coverFile) {
        data.append('cover', coverFile);
      }

      updateProfileMutation(data, {
        onSuccess: () => {
          toast.success('Cập nhật thành công!');
          setAvatarFile(null);
          setCoverFile(null);
          setAvatarPreview(null);
          setCoverPreview(null);
          setIsSaving(false);
        },
        onError: err => {
          toast.error(err?.message || 'Cập nhật thất bại');
          setIsSaving(false);
        },
      });
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra');
      setIsSaving(false);
    }
  };

  const handleChange = field => e => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleLocationSelect = address => {
    setFormData(prev => ({ ...prev, location: address }));
  };

  if (profileLoading && !currentProfile) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-content dark:text-white mb-2">
          Edit Profile
        </h1>
        <p className="text-neutral-500 text-sm">
          Update your profile information
        </p>
      </div>

      {/* Cover & Avatar */}
      <div className="space-y-4">
        {/* Cover */}
        <div className="relative h-32 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <img
            src={
              coverPreview ||
              currentProfile?.cover ||
              'https://images.unsplash.com/photo-1557683316-973673baf926?w=800'
            }
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="hidden"
          />
          <button
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
          >
            <Camera size={24} className="text-white" />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex items-end gap-4 -mt-12 ml-4">
          <div className="relative">
            <img
              src={avatarPreview || currentProfile?.avatar}
              alt={currentProfile?.username}
              className="w-24 h-24 rounded-full object-cover"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity"
            >
              <Camera size={20} className="text-white" />
            </button>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-content dark:text-white text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Change Photo
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <InputField
          icon={User}
          label="Name"
          value={formData.name}
          onChange={handleChange('name')}
          placeholder="Your name"
        />
        <InputField
          icon={User}
          label="Username"
          value={formData.username}
          onChange={handleChange('username')}
          placeholder="Your username"
        />
        <InputField
          icon={FileText}
          label="Bio"
          value={formData.bio}
          onChange={handleChange('bio')}
          placeholder="Tell us about yourself"
          multiline
        />
        <InputField
          icon={Link2}
          label="Website"
          value={formData.website}
          onChange={handleChange('website')}
          placeholder="https://yourwebsite.com"
        />
        <InputField
          icon={MapPin}
          label="Location"
          value={formData.location}
          onChange={handleChange('location')}
          placeholder="Where are you based?"
          rightElement={
            <button
              type="button"
              onClick={() => setIsLocationPickerOpen(true)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 hover:text-primary transition-colors"
              title="Pick from map"
            >
              <MapIcon size={18} />
            </button>
          }
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        {isLocationPickerOpen && (
          <LocationPickerModal
            isOpen={isLocationPickerOpen}
            onClose={() => setIsLocationPickerOpen(false)}
            onSelect={handleLocationSelect}
            initialLocation={formData.location}
          />
        )}
      </Suspense>
    </div>
  );
};

export default ProfileSettings;
