import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { Language } from '../types';
import { en } from './en';
import { vi } from './vi';

// Các ngôn ngữ được hỗ trợ
const translations = {
  en,
  vi,
};

export type LocaleType = Language | 'system';

// Định nghĩa kiểu ngữ cảnh i18n
interface I18nContextProps {
  t: (key: string, options?: Record<string, any>) => string;
  locale: Language;
  setLocale: (locale: LocaleType) => Promise<void>;
  getDeviceLanguage: () => Promise<Language>;
}

const defaultLocale: Language = 'en';

// Tạo ngữ cảnh với giá trị mặc định
const I18nContext = createContext<I18nContextProps>({
  t: () => '',
  locale: defaultLocale,
  setLocale: async () => {},
  getDeviceLanguage: async () => defaultLocale,
});

// Danh sách các ngôn ngữ được hỗ trợ
export const SUPPORTED_LANGUAGES = [
  { code: 'system', label: 'app.system_default' },
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
];

// Hàm lấy ngôn ngữ của thiết bị
export const getDeviceLanguage = (): Language => {
  const deviceLocale = Localization.locale.split('-')[0];
  return (deviceLocale in translations ? deviceLocale : defaultLocale) as Language;
};

// Provider component
export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Language>(defaultLocale);

  useEffect(() => {
    // Tải ngôn ngữ đã lưu hoặc sử dụng ngôn ngữ mặc định của thiết bị
    const loadSavedLocale = async () => {
      try {
        const savedLocale = await AsyncStorage.getItem('chatly_language');
        
        if (savedLocale === 'system') {
          // Sử dụng ngôn ngữ hệ thống nếu đã chọn 'system'
          setLocaleState(getDeviceLanguage());
        } else if (savedLocale && savedLocale in translations) {
          setLocaleState(savedLocale as Language);
        } else {
          // Lưu ngôn ngữ thiết bị vào bộ nhớ nếu không có ngôn ngữ đã lưu
          const deviceLang = getDeviceLanguage();
          setLocaleState(deviceLang);
          await AsyncStorage.setItem('chatly_language', deviceLang);
        }
      } catch (error) {
        console.error('Error loading language:', error);
        setLocaleState(defaultLocale);
      }
    };

    loadSavedLocale();
  }, []);

  // Hàm thay đổi ngôn ngữ
  const setLocale = async (newLocale: LocaleType) => {
    try {
      if (newLocale === 'system') {
        // Lưu cài đặt 'system' và sử dụng ngôn ngữ thiết bị
        await AsyncStorage.setItem('chatly_language', 'system');
        setLocaleState(getDeviceLanguage());
      } else {
        // Lưu ngôn ngữ đã chọn
        await AsyncStorage.setItem('chatly_language', newLocale);
        setLocaleState(newLocale);
      }
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  // Hàm lấy ngôn ngữ thiết bị
  const getDeviceLanguageAsync = async () => {
    return getDeviceLanguage();
  };

  // Hàm dịch
  const t = (key: string, options?: Record<string, any>) => {
    // Tách key thành các phần
    const keys = key.split('.');
    
    // Lấy đối tượng dịch cho ngôn ngữ hiện tại
    let result: any = translations[locale];
    
    // Duyệt qua các phần của khóa để lấy chuỗi dịch
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        // Trả về key nếu không tìm thấy bản dịch
        return key;
      }
    }
    
    // Nếu có options, thay thế các placeholder trong chuỗi dịch
    if (options && typeof result === 'string') {
      Object.keys(options).forEach(opt => {
        const regex = new RegExp(`{{${opt}}}`, 'g');
        result = result.replace(regex, options[opt]);
      });
    }
    
    return typeof result === 'string' ? result : key;
  };

  const value = {
    t,
    locale,
    setLocale,
    getDeviceLanguage: getDeviceLanguageAsync
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

// Hook để sử dụng i18n
export const useTranslation = () => useContext(I18nContext);

export default {
  Provider: I18nProvider,
  useTranslation,
  SUPPORTED_LANGUAGES,
}; 