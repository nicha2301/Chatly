import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../i18n';
import authService from '../services/authService';
import { useSessionTimeout } from './useSessionTimeout';

interface UseSessionExpirationAlertOptions {
  // Thời gian hiển thị thông báo trước khi phiên hết hạn (ms)
  warningTime?: number; 
  // Thời gian làm mới lại token khi người dùng chọn gia hạn (ms)
  extendTime?: number;
  // Bật/tắt tính năng cảnh báo
  enabled?: boolean;
}

const DEFAULT_WARNING_TIME = 5 * 60 * 1000; // 5 phút
const DEFAULT_EXTEND_TIME = 30 * 60 * 1000; // 30 phút

// Keys cho AsyncStorage
const SESSION_WARNINGS_KEY = 'session_warnings';

/**
 * Hook để hiển thị thông báo khi phiên sắp hết hạn và cho phép gia hạn
 */
export const useSessionExpirationAlert = (options: UseSessionExpirationAlertOptions = {}) => {
  const [showSessionWarnings, setShowSessionWarnings] = useState<boolean>(true);
  
  const {
    warningTime = DEFAULT_WARNING_TIME,
    extendTime = DEFAULT_EXTEND_TIME,
    enabled = showSessionWarnings
  } = options;
  
  const { t } = useTranslation();
  const { lastActivity, isSessionExpired, resetActivity } = useSessionTimeout({
    sessionTimeout: warningTime + 60 * 1000 // Khoảng thời gian trước khi hiển thị thông báo
  });
  
  const [showWarning, setShowWarning] = useState(false);
  const [remaining, setRemaining] = useState(0);
  
  // Tải cài đặt cảnh báo từ AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const showWarningsValue = await AsyncStorage.getItem(SESSION_WARNINGS_KEY);
        if (showWarningsValue !== null) {
          setShowSessionWarnings(showWarningsValue === 'true');
        }
      } catch (error) {
        console.error('Error loading session warning settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Kiểm tra và hiển thị thông báo khi phiên sắp hết hạn
  useEffect(() => {
    if (!enabled) return;
    
    const checkExpiration = () => {
      const now = Date.now();
      const inactive = now - lastActivity;
      const timeToExpire = warningTime - inactive;
      
      // Nếu thời gian không hoạt động gần tới ngưỡng cảnh báo
      if (timeToExpire > 0 && timeToExpire <= warningTime) {
        setRemaining(Math.floor(timeToExpire / 1000)); // Chuyển đổi sang giây
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };
    
    // Kiểm tra mỗi giây
    const intervalId = setInterval(checkExpiration, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, lastActivity, warningTime]);
  
  // Xử lý khi người dùng chọn gia hạn
  const handleExtendSession = async () => {
    try {
      const newToken = await authService.refreshToken();
      if (newToken) {
        resetActivity();
        setShowWarning(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error extending session:', error);
      return false;
    }
  };
  
  // Format thời gian còn lại dưới dạng phút:giây
  const getFormattedTimeRemaining = () => {
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return {
    showWarning: showWarning && enabled,
    remaining,
    formattedRemaining: getFormattedTimeRemaining(),
    extendSession: handleExtendSession,
    warningMessage: t('auth.session_expiry_warning', { time: getFormattedTimeRemaining() }),
    isSessionExpired
  };
}; 