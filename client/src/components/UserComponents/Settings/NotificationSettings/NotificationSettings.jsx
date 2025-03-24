import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { userSettingsService } from "../../../../services/userSettingsService";
import NotificationSection from "./NotificationSection";
import ToggleSwitch from "./ToggleSwitch";
import { setUser } from "../../../../redux/features/userSlice";

const NotificationSettings = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [settings, setSettings] = useState({
    emailNotifications: user.settings?.notifications?.email || false,
    pushNotifications: user.settings?.notifications?.push || false,
    newFollower: user.settings?.notifications?.newFollower || false,
    likes: user.settings?.notifications?.likes || false,
    comments: user.settings?.notifications?.comments || false,
    mentions: user.settings?.notifications?.mentions || false,
    directMessages: user.settings?.notifications?.directMessages || false,
    systemUpdates: user.settings?.notifications?.systemUpdates || false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (settingName) => {
    setSettings({
      ...settings,
      [settingName]: !settings[settingName],
    });
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const response = await userSettingsService.updateNotificationSettings({
        email: settings.emailNotifications,
        push: settings.pushNotifications,
        newFollower: settings.newFollower,
        likes: settings.likes,
        comments: settings.comments,
        mentions: settings.mentions,
        directMessages: settings.directMessages,
        systemUpdates: settings.systemUpdates,
      });

      if (response.success) {
        // Update the user in Redux with the new settings
        dispatch(
          setUser({
            ...user,
            settings: {
              ...user.settings,
              notifications: {
                email: settings.emailNotifications,
                push: settings.pushNotifications,
                newFollower: settings.newFollower,
                likes: settings.likes,
                comments: settings.comments,
                mentions: settings.mentions,
                directMessages: settings.directMessages,
                systemUpdates: settings.systemUpdates,
              },
            },
          })
        );
        toast.success("Notification settings updated successfully");
      } else {
        toast.error("Failed to update notification settings");
      }
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("An error occurred while updating notification settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Notification Settings</h1>

      <NotificationSection title="Notification Channels">
        <div className="space-y-4">
          <ToggleSwitch
            label="Email Notifications"
            checked={settings.emailNotifications}
            onChange={() => handleChange("emailNotifications")}
          />
          <ToggleSwitch
            label="Push Notifications"
            checked={settings.pushNotifications}
            onChange={() => handleChange("pushNotifications")}
          />
        </div>
      </NotificationSection>

      <NotificationSection title="Activity Notifications">
        <div className="space-y-4">
          <ToggleSwitch
            label="New Follower"
            checked={settings.newFollower}
            onChange={() => handleChange("newFollower")}
          />
          <ToggleSwitch
            label="Likes"
            checked={settings.likes}
            onChange={() => handleChange("likes")}
          />
          <ToggleSwitch
            label="Comments"
            checked={settings.comments}
            onChange={() => handleChange("comments")}
          />
          <ToggleSwitch
            label="Mentions"
            checked={settings.mentions}
            onChange={() => handleChange("mentions")}
          />
        </div>
      </NotificationSection>

      <NotificationSection title="Other Notifications">
        <div className="space-y-4">
          <ToggleSwitch
            label="Direct Messages"
            checked={settings.directMessages}
            onChange={() => handleChange("directMessages")}
          />
          <ToggleSwitch
            label="System Updates"
            checked={settings.systemUpdates}
            onChange={() => handleChange("systemUpdates")}
          />
        </div>
      </NotificationSection>

      <div className="flex justify-end mt-6">
        <button
          onClick={saveSettings}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;
