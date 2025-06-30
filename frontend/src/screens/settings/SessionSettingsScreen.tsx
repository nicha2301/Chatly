import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Switch, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { StyledText } from '../../components/atoms/StyledText';
import { useTranslation } from '../../i18n';
import { RootState } from '../../store';

// Keys cho AsyncStorage
const SESSION_AUTO_RENEWAL_KEY = 'session_auto_renewal';
const SESSION_WARNINGS_KEY = 'session_warnings';
const SESSION_TIMEOUT_KEY = 'session_timeout';

// Các tùy chọn thời gian chờ phiên
const SESSION_TIMEOUT_OPTIONS = [
  { label: '15 minutes', value: 15 * 60 * 1000 },
  { label: '30 minutes', value: 30 * 60 * 1000 },
  { label: '1 hour', value: 60 * 60 * 1000 },
  { label: '2 hours', value: 2 * 60 * 60 * 1000 },
  { label: '4 hours', value: 4 * 60 * 60 * 1000 },
];

const SessionSettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colorScheme } = useSelector((state: RootState) => state.theme);
  const isDarkMode = colorScheme === 'dark';
  
  const [autoRenewal, setAutoRenewal] = useState<boolean>(true);
  const [showWarnings, setShowWarnings] = useState<boolean>(true);
  const [sessionTimeout, setSessionTimeout] = useState<number>(60 * 60 * 1000); // Mặc định 1 giờ
  const [showTimeoutPicker, setShowTimeoutPicker] = useState<boolean>(false);
  
  // Tải cài đặt phiên từ AsyncStorage
  useEffect(() => {
    const loadSessionSettings = async () => {
      try {
        const [autoRenewalValue, showWarningsValue, sessionTimeoutValue] = await Promise.all([
          AsyncStorage.getItem(SESSION_AUTO_RENEWAL_KEY),
          AsyncStorage.getItem(SESSION_WARNINGS_KEY),
          AsyncStorage.getItem(SESSION_TIMEOUT_KEY)
        ]);
        
        if (autoRenewalValue !== null) {
          setAutoRenewal(autoRenewalValue === 'true');
        }
        
        if (showWarningsValue !== null) {
          setShowWarnings(showWarningsValue === 'true');
        }
        
        if (sessionTimeoutValue !== null) {
          setSessionTimeout(parseInt(sessionTimeoutValue, 10));
        }
      } catch (error) {
        console.error('Error loading session settings:', error);
      }
    };
    
    loadSessionSettings();
  }, []);
  
  // Lưu cài đặt phiên vào AsyncStorage
  const saveSessionSettings = async (key: string, value: string | boolean | number) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };
  
  // Xử lý thay đổi tùy chọn tự động gia hạn
  const handleAutoRenewalChange = (value: boolean) => {
    setAutoRenewal(value);
    saveSessionSettings(SESSION_AUTO_RENEWAL_KEY, value);
  };
  
  // Xử lý thay đổi tùy chọn hiển thị cảnh báo
  const handleShowWarningsChange = (value: boolean) => {
    setShowWarnings(value);
    saveSessionSettings(SESSION_WARNINGS_KEY, value);
  };
  
  // Xử lý thay đổi thời gian chờ phiên
  const handleSessionTimeoutChange = (value: number) => {
    setSessionTimeout(value);
    saveSessionSettings(SESSION_TIMEOUT_KEY, value);
    setShowTimeoutPicker(false);
  };
  
  // Format thời gian chờ phiên để hiển thị
  const formatSessionTimeout = (milliseconds: number): string => {
    const minutes = milliseconds / (60 * 1000);
    if (minutes < 60) {
      return `${minutes} ${t('common.minutes')}`;
    } else {
      const hours = minutes / 60;
      return `${hours} ${hours === 1 ? t('common.hour') : t('common.hours')}`;
    }
  };
  
  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#121212' : '#f9fafb' }
      ]}
    >
      <View style={styles.section}>
        <StyledText variant="h2" style={styles.sectionTitle}>
          {t('settings.session')}
        </StyledText>
        
        <View style={[
          styles.card,
          { backgroundColor: isDarkMode ? '#1f2937' : '#ffffff' }
        ]}>
          {/* Tùy chọn thời gian chờ phiên */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowTimeoutPicker(!showTimeoutPicker)}
          >
            <View style={styles.settingLabelContainer}>
              <StyledText variant="body" weight="medium">
                {t('settings.session_timeout')}
              </StyledText>
              <StyledText variant="caption" color="secondary" style={styles.settingDescription}>
                {formatSessionTimeout(sessionTimeout)}
              </StyledText>
            </View>
            <Ionicons
              name={showTimeoutPicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={isDarkMode ? "#9ca3af" : "#6b7280"}
            />
          </TouchableOpacity>
          
          {/* Danh sách các tùy chọn thời gian chờ phiên */}
          {showTimeoutPicker && (
            <View style={styles.timeoutOptions}>
              {SESSION_TIMEOUT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.timeoutOption,
                    sessionTimeout === option.value && styles.selectedTimeoutOption,
                    sessionTimeout === option.value && {
                      backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.1)' : 'rgba(219, 234, 254, 1)'
                    }
                  ]}
                  onPress={() => handleSessionTimeoutChange(option.value)}
                >
                  <StyledText
                    variant="body-sm"
                    weight={sessionTimeout === option.value ? "medium" : "regular"}
                    color={sessionTimeout === option.value ? "primary" : "default"}
                  >
                    {option.label}
                  </StyledText>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Tùy chọn cảnh báo phiên */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <StyledText variant="body" weight="medium">
                {t('settings.enable_session_warnings')}
              </StyledText>
              <StyledText variant="caption" color="secondary" style={styles.settingDescription}>
                {t('auth.session_renewal_description')}
              </StyledText>
            </View>
            <Switch
              value={showWarnings}
              onValueChange={handleShowWarningsChange}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={'#ffffff'}
            />
          </View>
          
          {/* Tùy chọn tự động gia hạn */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <StyledText variant="body" weight="medium">
                {t('settings.session_auto_renewal')}
              </StyledText>
              <StyledText variant="caption" color="secondary" style={styles.settingDescription}>
                {t('auth.session_auto_renewal')}
              </StyledText>
            </View>
            <Switch
              value={autoRenewal}
              onValueChange={handleAutoRenewalChange}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={'#ffffff'}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingLabelContainer: {
    flex: 1,
    paddingRight: 8,
  },
  settingDescription: {
    marginTop: 4,
  },
  timeoutOptions: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timeoutOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedTimeoutOption: {
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
});

export default SessionSettingsScreen; 