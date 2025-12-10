import { useState } from "react";
import {
  Shield,
  Eye,
  MessageCircle,
  Search,
  Activity,
  Lock,
  Globe,
} from "lucide-react";

const PrivacySettings = () => {
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    postVisibility: "public",
    messagePermission: "everyone",
    searchVisibility: true,
    activityStatus: true,
  });

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-black dark:text-white">
          {label}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled
            ? "bg-black dark:bg-white"
            : "bg-neutral-200 dark:bg-neutral-700"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
            enabled
              ? "translate-x-5 bg-white dark:bg-black"
              : "translate-x-0.5 bg-white dark:bg-neutral-400"
          }`}
        />
      </button>
    </div>
  );

  const SelectOption = ({ value, onChange, label, description, options }) => (
    <div className="py-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-black dark:text-white">
            {label}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              value === option.value
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
          Privacy
        </h1>
        <p className="text-neutral-500 text-sm">
          Control who can see your content and interact with you
        </p>
      </div>

      {/* Visibility Settings */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-neutral-500" />
            <h3 className="text-sm font-medium text-black dark:text-white">
              Visibility
            </h3>
          </div>
        </div>
        <div className="p-4">
          <SelectOption
            label="Profile visibility"
            description="Who can view your profile"
            value={privacy.profileVisibility}
            onChange={(value) =>
              setPrivacy({ ...privacy, profileVisibility: value })
            }
            options={[
              { value: "public", label: "Public" },
              { value: "followers", label: "Followers" },
              { value: "private", label: "Private" },
            ]}
          />
          <SelectOption
            label="Post visibility"
            description="Default visibility for new posts"
            value={privacy.postVisibility}
            onChange={(value) =>
              setPrivacy({ ...privacy, postVisibility: value })
            }
            options={[
              { value: "public", label: "Public" },
              { value: "followers", label: "Followers" },
              { value: "private", label: "Only me" },
            ]}
          />
        </div>
      </div>

      {/* Interaction Settings */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-neutral-500" />
            <h3 className="text-sm font-medium text-black dark:text-white">
              Interactions
            </h3>
          </div>
        </div>
        <div className="p-4">
          <SelectOption
            label="Message permissions"
            description="Who can send you messages"
            value={privacy.messagePermission}
            onChange={(value) =>
              setPrivacy({ ...privacy, messagePermission: value })
            }
            options={[
              { value: "everyone", label: "Everyone" },
              { value: "followers", label: "Followers" },
              { value: "nobody", label: "Nobody" },
            ]}
          />
          <ToggleSwitch
            label="Show in search results"
            description="Allow others to find you through search"
            enabled={privacy.searchVisibility}
            onChange={() =>
              setPrivacy({
                ...privacy,
                searchVisibility: !privacy.searchVisibility,
              })
            }
          />
          <ToggleSwitch
            label="Show activity status"
            description="Let others see when you're online"
            enabled={privacy.activityStatus}
            onChange={() =>
              setPrivacy({
                ...privacy,
                activityStatus: !privacy.activityStatus,
              })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
