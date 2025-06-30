import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation, getDeviceLanguage } from '../../i18n';
import { StyledText } from '../atoms/StyledText';
import { Ionicons } from '@expo/vector-icons';

export const LanguageSelector: React.FC = () => {
  const { changeLanguage, resetToDeviceLanguage, locale, t } = useTranslation();
  
  const languages = [
    { code: 'en', label: 'English', icon: 'language-outline', flag: '🇺🇸' },
    { code: 'vi', label: 'Tiếng Việt', icon: 'language-outline', flag: '🇻🇳' },
    { code: 'system', label: t('settings.systemDefault') || 'System', icon: 'settings-outline', flag: '🌐' },
  ];

  const currentLanguage = locale || 'en';

  const handleLanguageChange = (languageCode: string) => {
    if (languageCode === 'system') {
      resetToDeviceLanguage();
    } else {
      changeLanguage(languageCode);
    }
  };

  return (
    <View className="flex-row flex-wrap">
      {languages.map((language) => (
        <TouchableOpacity
          key={language.code}
          onPress={() => handleLanguageChange(language.code)}
          className={`py-2 px-3 items-center mx-1 ${
            (language.code === 'system' && currentLanguage === getDeviceLanguage()) || 
            (language.code === currentLanguage && language.code !== 'system')
              ? 'bg-blue-100 dark:bg-blue-900 rounded-md' 
              : ''
          }`}
          style={styles.languageButton}
        >
          <View className="flex-row items-center">
            <StyledText variant="body">{language.flag}</StyledText>
            <StyledText
              variant="caption"
              color={
                (language.code === 'system' && currentLanguage === getDeviceLanguage()) || 
                (language.code === currentLanguage && language.code !== 'system') 
                  ? 'primary' 
                  : 'gray'
              }
              className="ml-1"
            >
              {language.label}
            </StyledText>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    flex: 1,
    minWidth: 90,
    justifyContent: 'center',
  }
}); 