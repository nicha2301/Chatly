import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { StyledText } from '../atoms/StyledText';
import { RootState } from '../../store';
import { setTheme } from '../../store/slices/themeSlice';
import { useTranslation } from '../../i18n';

export const ThemeToggle: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { theme, colorScheme } = useSelector((state: RootState) => state.theme);

  const themes = [
    { value: 'light', icon: 'sunny-outline', label: t('settings.light') || 'Light' },
    { value: 'dark', icon: 'moon-outline', label: t('settings.dark') || 'Dark' },
    { value: 'system', icon: 'settings-outline', label: t('settings.system') || 'System' },
  ] as const;

  return (
    <View className="flex-row">
      {themes.map(({ value, icon, label }) => (
        <TouchableOpacity
          key={value}
          onPress={() => dispatch(setTheme(value))}
          className={`flex-1 py-2 px-3 items-center ${
            theme === value 
              ? 'bg-blue-100 dark:bg-blue-900 rounded-md' 
              : ''
          }`}
        >
          <Ionicons
            name={icon}
            size={18}
            color={theme === value ? '#0072ff' : '#6b7280'}
          />
          <StyledText
            variant="caption"
            color={theme === value ? 'primary' : 'gray'}
            className="mt-1"
          >
            {label}
          </StyledText>
        </TouchableOpacity>
      ))}
    </View>
  );
}; 