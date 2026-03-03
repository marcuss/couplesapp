/**
 * Settings Page
 * User settings for language, theme, and notifications
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Moon, Sun, Monitor, Bell, Shield, Trash2, ChevronRight } from 'lucide-react';
import { useTheme } from '../../design-system/components/ThemeProvider';
import { availableLanguages, LanguageCode } from '../../i18n';

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const handleLanguageChange = (code: LanguageCode) => {
    i18n.changeLanguage(code);
  };

  const themeOptions = [
    { value: 'light' as const, label: t('settings.lightMode'), icon: Sun },
    { value: 'dark' as const, label: t('settings.darkMode'), icon: Moon },
    { value: 'system' as const, label: t('settings.systemPreference'), icon: Monitor },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('settings.title')}</p>
      </div>

      {/* Language Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.language')}</h2>
        </div>
        
        <div className="space-y-2">
          {availableLanguages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                i18n.language === language.code
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{language.flag}</span>
                <span className="text-gray-900 dark:text-white">{language.name}</span>
              </span>
              {i18n.language === language.code && (
                <span className="text-rose-500 font-medium">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Moon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.theme')}</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                theme === option.value
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <option.icon className={`w-6 h-6 ${
                theme === option.value
                  ? 'text-rose-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`} />
              <span className={`text-sm ${
                theme === option.value
                  ? 'text-rose-600 dark:text-rose-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.notifications')}</h2>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">{t('settings.emailNotifications')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 dark:peer-focus:ring-rose-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">{t('settings.pushNotifications')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 dark:peer-focus:ring-rose-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Privacy Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.privacy')}</h2>
        </div>
        
        <button className="w-full flex items-center justify-between p-3 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <span className="flex items-center gap-3">
            <Trash2 className="w-5 h-5" />
            <span>{t('settings.deleteAccount')}</span>
          </span>
          <ChevronRight className="w-5 h-5" />
        </button>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('settings.deleteConfirm')}</p>
      </div>
    </div>
  );
};

export default SettingsPage;
