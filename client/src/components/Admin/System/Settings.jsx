import React, { useState, useEffect } from "react";
import { Save, Shield, Bell, FileText, Server } from "lucide-react";
import { useDispatch } from "react-redux";
import { getAdminSettings, updateAdminSettings } from "../../../redux/actions/adminActions";
import { toast } from "react-hot-toast";

const Settings = () => {
    const dispatch = useDispatch();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Use Redux action
                const response = await dispatch(getAdminSettings()).unwrap(); 
                if (response && response.code === 1) {
                     setSettings(response.data);
                } else {
                     // Fallback mock if API not ready or returns empty
                    setSettings({
                        security: {
                            twoFactorAuth: true,
                            passwordExpiry: 90,
                            loginAlerts: true
                        },
                        content: {
                            autoModeration: true,
                            profanityFilter: true,
                            imageScanning: false
                        },
                        notifications: {
                            emailDigests: true,
                            pushNotifications: false
                        }
                    });
                }
            } catch (error) {
                toast.error("Failed to load settings");
                // Fallback mock on error
                setSettings({
                    security: {
                        twoFactorAuth: true,
                        passwordExpiry: 90,
                        loginAlerts: true
                    },
                    content: {
                        autoModeration: true,
                        profanityFilter: true,
                        imageScanning: false
                    },
                    notifications: {
                        emailDigests: true,
                        pushNotifications: false
                    }
                });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [dispatch]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await dispatch(updateAdminSettings(settings)).unwrap();
            toast.success("Settings saved successfully");
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

    const updateSetting = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }));
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Admin Settings</h2>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <SettingsGroup title="Security" icon={Shield}>
                <Toggle 
                    label="Two-Factor Authentication" 
                    description="Require 2FA for all admin accounts"
                    checked={settings.security.twoFactorAuth}
                    onChange={(v) => updateSetting('security', 'twoFactorAuth', v)}
                />
                <Toggle 
                    label="Login Alerts" 
                    description="Notify admins of new login attempts"
                    checked={settings.security.loginAlerts}
                    onChange={(v) => updateSetting('security', 'loginAlerts', v)}
                />
            </SettingsGroup>

            <SettingsGroup title="Content Moderation" icon={FileText}>
                <Toggle 
                    label="Auto-Moderation" 
                    description="Automatically flag suspicious content"
                    checked={settings.content.autoModeration}
                    onChange={(v) => updateSetting('content', 'autoModeration', v)}
                />
                <Toggle 
                    label="Profanity Filter" 
                    description="Mask detected profanity in comments"
                    checked={settings.content.profanityFilter}
                    onChange={(v) => updateSetting('content', 'profanityFilter', v)}
                />
            </SettingsGroup>

             <SettingsGroup title="Notifications" icon={Bell}>
                <Toggle 
                    label="Email Digests" 
                    description="Receive weekly activity summaries"
                    checked={settings.notifications.emailDigests}
                    onChange={(v) => updateSetting('notifications', 'emailDigests', v)}
                />
            </SettingsGroup>
        </div>
    );
};

const SettingsGroup = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
            <Icon size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="p-6 space-y-4">
            {children}
        </div>
    </div>
);

const Toggle = ({ label, checked, onChange, description }) => (
    <div className="flex items-center justify-between">
        <div>
            <label className="font-medium text-gray-700">{label}</label>
            {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        <button 
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
                ${checked ? 'bg-blue-600' : 'bg-gray-200'}
            `}
        >
            <span
                aria-hidden="true"
                className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${checked ? 'translate-x-5' : 'translate-x-0'}
                `}
            />
        </button>
    </div>
);

export default Settings;
