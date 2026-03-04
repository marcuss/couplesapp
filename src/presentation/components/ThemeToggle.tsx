/**
 * Theme Toggle Component
 * Button for toggling between light and dark mode
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../design-system/components/ThemeProvider';

type Theme = 'light' | 'dark' | 'system';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'dark':
        return <Moon className="w-5 h-5 text-blue-400" />;
      case 'system':
        return <Monitor className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return t('settings.lightMode');
      case 'dark':
        return t('settings.darkMode');
      case 'system':
        return t('settings.systemPreference');
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
      <span className="hidden sm:inline text-sm font-medium">{getLabel()}</span>
    </button>
  );
};

export default ThemeToggle;
