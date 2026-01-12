import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { adminService } from "../../services/adminService";
import type { Setting } from "../../types";
import toast from "react-hot-toast";

export default function Settings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingValues, setEditingValues] = useState<Record<string, string | number | boolean>>({});
  const [savingKeys, setSavingKeys] = useState<string[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await adminService.getSettings();
      if (response.success) {
        setSettings(response.data);
        const values: Record<string, string | number | boolean> = {};
        response.data.forEach(setting => {
          values[setting.key] = setting.value;
        });
        setEditingValues(values);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    setSavingKeys([...savingKeys, key]);
    try {
      const response = await adminService.updateSetting(key, editingValues[key]);
      if (response.success) {
        toast.success("Setting updated");
        setSettings(settings.map(s => s.key === key ? { ...s, value: editingValues[key] } : s));
      }
    } catch (error) {
      console.error("Failed to update setting:", error);
    } finally {
      setSavingKeys(savingKeys.filter(k => k !== key));
    }
  };

  const handleInitialize = async () => {
    if (!confirm("This will reset all settings to their default values. Continue?")) return;
    try {
      const response = await adminService.initializeSettings();
      if (response.success) {
        toast.success("Settings initialized");
        loadSettings();
      }
    } catch (error) {
      console.error("Failed to initialize settings:", error);
    }
  };

  const formatValue = (value: number | string | boolean, key: string) => {
    if (typeof value === 'number' && key.includes('timeout')) {
      const seconds = value / 1000;
      if (seconds >= 3600) {
        return `${(seconds / 3600).toFixed(1)} hours`;
      } else if (seconds >= 60) {
        return `${(seconds / 60).toFixed(0)} minutes`;
      }
      return `${seconds} seconds`;
    }
    return String(value);
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    const category = setting.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, Setting[]>);

  const categoryTitles: Record<string, string> = {
    ai: 'AI Settings',
    rate_limiting: 'Rate Limiting',
    general: 'General Settings',
    custom: 'Custom Settings',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Settings | WhatsApp AI Bot"
        description="System settings and configuration"
      />
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Settings
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Configure system settings and AI behavior
              </p>
            </div>
            <button
              onClick={handleInitialize}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Reset to Defaults
            </button>
          </div>

          {Object.entries(groupedSettings).map(([category, categorySettings]) => (
            <div key={category} className="mb-8 last:mb-0">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 capitalize">
                {categoryTitles[category] || category}
              </h2>
              <div className="space-y-4">
                {categorySettings.map((setting) => (
                  <div
                    key={setting.key}
                    className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-white">
                        {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {setting.description}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Current: {formatValue(setting.value, setting.key)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {typeof setting.value === 'boolean' ? (
                        <button
                          onClick={() => {
                            setEditingValues({ ...editingValues, [setting.key]: !editingValues[setting.key] });
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            editingValues[setting.key] ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              editingValues[setting.key] ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      ) : (
                        <input
                          type={typeof setting.value === 'number' ? 'number' : 'text'}
                          value={editingValues[setting.key] as string | number}
                          onChange={(e) => {
                            const value = typeof setting.value === 'number'
                              ? parseInt(e.target.value) || 0
                              : e.target.value;
                            setEditingValues({ ...editingValues, [setting.key]: value });
                          }}
                          className="w-40 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
                        />
                      )}
                      <button
                        onClick={() => handleSave(setting.key)}
                        disabled={savingKeys.includes(setting.key) || editingValues[setting.key] === setting.value}
                        className="px-4 py-2 bg-brand-500 text-white text-sm rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingKeys.includes(setting.key) ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {settings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No settings found</p>
              <button
                onClick={handleInitialize}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
              >
                Initialize Default Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

