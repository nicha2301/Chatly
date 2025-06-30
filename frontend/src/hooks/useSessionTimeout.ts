import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import { useAuth } from './useAuth';

interface UseSessionTimeoutOptions {
  // Thời gian không hoạt động trước khi làm mới token (ms)
  inactivityTimeout?: number;
  // Thời gian trước khi phiên hết hạn và cần đăng xuất (ms)
  sessionTimeout?: number;
  // Bật/tắt tính năng tự động gia hạn
  enabled?: boolean;
  // Sự kiện được coi là hoạt động của người dùng
  events?: string[];
}

const DEFAULT_INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 phút
const DEFAULT_SESSION_TIMEOUT = 60 * 60 * 1000; // 1 giờ
const DEFAULT_EVENTS = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];

// Keys cho AsyncStorage
const SESSION_AUTO_RENEWAL_KEY = 'session_auto_renewal';
const SESSION_WARNINGS_KEY = 'session_warnings';
const SESSION_TIMEOUT_KEY = 'session_timeout';

/**
 * Hook để quản lý thời gian không hoạt động và tự động làm mới token
 */
export const useSessionTimeout = (options: UseSessionTimeoutOptions = {}) => {
  const [storedSettings, setStoredSettings] = useState({
    autoRenewal: true,
    sessionTimeout: DEFAULT_SESSION_TIMEOUT,
  });
  
  const { 
    inactivityTimeout = DEFAULT_INACTIVITY_TIMEOUT, 
    sessionTimeout = storedSettings.sessionTimeout,
    enabled = options.enabled !== undefined ? options.enabled : storedSettings.autoRenewal,
    events = DEFAULT_EVENTS
  } = options;
  
  const { isAuthenticated, logout } = useAuth();
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Tải cài đặt từ AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [autoRenewalValue, sessionTimeoutValue] = await Promise.all([
          AsyncStorage.getItem(SESSION_AUTO_RENEWAL_KEY),
          AsyncStorage.getItem(SESSION_TIMEOUT_KEY)
        ]);
        
        setStoredSettings({
          autoRenewal: autoRenewalValue === null ? true : autoRenewalValue === 'true',
          sessionTimeout: sessionTimeoutValue === null ? DEFAULT_SESSION_TIMEOUT : parseInt(sessionTimeoutValue, 10)
        });
      } catch (error) {
        console.error('Error loading session settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Thiết lập các timer khi được xác thực
  useEffect(() => {
    if (!enabled || !isAuthenticated) return;
    
    const checkActivity = async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      // Nếu không hoạt động trong một thời gian dài, làm mới token
      if (timeSinceLastActivity > inactivityTimeout && !isRefreshing) {
        setIsRefreshing(true);
        try {
          // Thử làm mới token
          const newToken = await authService.refreshToken();
          if (newToken) {
            // Đặt lại thời gian hoạt động cuối cùng
            setLastActivity(Date.now());
          } else {
            // Không thể làm mới token
            setIsSessionExpired(true);
          }
        } catch (error) {
          console.error('Failed to refresh token:', error);
          setIsSessionExpired(true);
        } finally {
          setIsRefreshing(false);
        }
      }
    };
    
    // Kiểm tra hoạt động mỗi phút
    timeoutRef.current = setInterval(checkActivity, 60 * 1000);
    
    // Đăng xuất khi hết phiên
    sessionTimeoutRef.current = setTimeout(() => {
      setIsSessionExpired(true);
    }, sessionTimeout);
    
    return () => {
      if (timeoutRef.current) clearInterval(timeoutRef.current);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    };
  }, [enabled, isAuthenticated, lastActivity, inactivityTimeout, sessionTimeout]);
  
  // Xử lý khi phiên hết hạn
  useEffect(() => {
    if (isSessionExpired && isAuthenticated) {
      const handleExpiredSession = async () => {
        try {
          await logout();
        } catch (error) {
          console.error('Error during logout:', error);
        }
      };
      
      handleExpiredSession();
    }
  }, [isSessionExpired, isAuthenticated, logout]);
  
  // Thiết lập trình lắng nghe sự kiện người dùng
  useEffect(() => {
    if (!enabled || !isAuthenticated) return;
    
    const resetTimer = () => {
      setLastActivity(Date.now());
      setIsSessionExpired(false);
    };
    
    // Đăng ký các sự kiện người dùng
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });
    
    return () => {
      // Hủy đăng ký các sự kiện khi component unmount
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [enabled, isAuthenticated, events]);
  
  return {
    lastActivity,
    isSessionExpired,
    isRefreshing,
    resetActivity: () => setLastActivity(Date.now())
  };
}; 