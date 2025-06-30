import { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { demoApi } from './api';
import { store } from '../store';
import { 
  setToken, 
  setUser, 
  logoutUser, 
  startLoading,
  stopLoading,
  setError
} from '../store/slices/userSlice';
import { User } from '../types';

// Tên keys trong AsyncStorage
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'user';
export const REMEMBER_ME_KEY = 'remember_me';
export const DEMO_MODE_KEY = 'demo_mode';

// Interface cho dữ liệu đăng nhập/đăng ký
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  username?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

// Dịch vụ xác thực
class AuthService {
  // Kiểm tra xem có phiên đăng nhập hay không
  async checkAuth(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const user = await AsyncStorage.getItem(USER_KEY);
      
      if (token && user) {
        // Cập nhật Redux store
        store.dispatch(setToken(token));
        store.dispatch(setUser(JSON.parse(user)));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }
  
  // Đăng nhập
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      store.dispatch(startLoading());
      
      // Kiểm tra chế độ demo
      const isDemo = await demoApi.isDemoMode();
      
      let response: AxiosResponse<AuthResponse>;
      
      if (isDemo) {
        // Tạo dữ liệu giả lập cho demo mode
        const demoUser: User = {
          id: 'demo-123',
          email: credentials.email,
          displayName: credentials.email.split('@')[0],
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(credentials.email)}&background=0D8ABC&color=fff`,
          username: credentials.email.split('@')[0],
          status: 'online',
        };
        
        // Tạo response giả lập
        response = await demoApi.createDemoResponse({
          user: demoUser,
          token: 'demo-jwt-token',
          refreshToken: 'demo-refresh-token',
        });
        
        // Đặt chế độ demo
        await AsyncStorage.setItem(DEMO_MODE_KEY, 'true');
      } else {
        // Gọi API thực tế
        response = await api.post<AuthResponse>('/auth/login', {
          email: credentials.email,
          password: credentials.password,
        });
      }
      
      const { user, token, refreshToken } = response.data;
      
      // Lưu token vào AsyncStorage
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      
      // Lưu thông tin remember me nếu được chọn
      if (credentials.rememberMe) {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({
          email: credentials.email,
          rememberMe: true
        }));
      } else {
        await AsyncStorage.removeItem(REMEMBER_ME_KEY);
      }
      
      // Cập nhật Redux store
      store.dispatch(setToken(token));
      store.dispatch(setUser(user));
      
      return user;
    } catch (error: any) {
      console.error('Login error:', error);
      store.dispatch(setError(error.message || 'Đăng nhập thất bại'));
      throw error;
    } finally {
      store.dispatch(stopLoading());
    }
  }
  
  // Đăng ký
  async register(userData: RegisterData): Promise<User> {
    try {
      store.dispatch(startLoading());
      
      // Kiểm tra chế độ demo
      const isDemo = await demoApi.isDemoMode();
      
      let response: AxiosResponse<AuthResponse>;
      
      if (isDemo) {
        // Tạo dữ liệu giả lập cho demo mode
        const demoUser: User = {
          id: 'demo-register-123',
          email: userData.email,
          displayName: userData.fullName,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName)}&background=0D8ABC&color=fff`,
          username: userData.username || userData.email.split('@')[0],
          status: 'online',
        };
        
        // Tạo response giả lập
        response = await demoApi.createDemoResponse({
          user: demoUser,
          token: 'demo-jwt-token-register',
          refreshToken: 'demo-refresh-token-register',
        });
        
        // Đặt chế độ demo
        await AsyncStorage.setItem(DEMO_MODE_KEY, 'true');
      } else {
        // Gọi API thực tế
        response = await api.post<AuthResponse>('/auth/register', userData);
      }
      
      const { user, token, refreshToken } = response.data;
      
      // Lưu token vào AsyncStorage
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      
      // Cập nhật Redux store
      store.dispatch(setToken(token));
      store.dispatch(setUser(user));
      
      return user;
    } catch (error: any) {
      console.error('Register error:', error);
      store.dispatch(setError(error.message || 'Đăng ký thất bại'));
      throw error;
    } finally {
      store.dispatch(stopLoading());
    }
  }
  
  // Đăng xuất
  async logout(): Promise<void> {
    try {
      // Kiểm tra chế độ demo
      const isDemo = await demoApi.isDemoMode();
      
      if (!isDemo) {
        // Chỉ gọi API nếu không phải chế độ demo
        await api.post('/auth/logout');
      }
      
      // Xóa token và thông tin người dùng khỏi AsyncStorage
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      await AsyncStorage.removeItem(DEMO_MODE_KEY);
      
      // Cập nhật Redux store
      store.dispatch(logoutUser());
    } catch (error) {
      console.error('Logout error:', error);
      
      // Vẫn xóa thông tin người dùng ngay cả khi API thất bại
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      await AsyncStorage.removeItem(DEMO_MODE_KEY);
      
      store.dispatch(logoutUser());
    }
  }
  
  // Lấy thông tin người dùng
  async getCurrentUser(): Promise<User | null> {
    try {
      store.dispatch(startLoading());
      
      // Kiểm tra chế độ demo
      const isDemo = await demoApi.isDemoMode();
      
      if (isDemo) {
        // Trong chế độ demo, lấy thông tin người dùng từ AsyncStorage
        const userJson = await AsyncStorage.getItem(USER_KEY);
        if (!userJson) return null;
        
        const user = JSON.parse(userJson);
        store.dispatch(setUser(user));
        return user;
      }
      
      // Trong chế độ thực tế, gọi API để lấy thông tin người dùng
      const response = await api.get<User>('/users/me');
      const user = response.data;
      
      // Cập nhật thông tin người dùng trong AsyncStorage
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      
      // Cập nhật Redux store
      store.dispatch(setUser(user));
      
      return user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    } finally {
      store.dispatch(stopLoading());
    }
  }
  
  // Làm mới token
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      // Kiểm tra chế độ demo
      const isDemo = await demoApi.isDemoMode();
      
      let response: AxiosResponse<{ token: string, refreshToken?: string }>;
      
      if (isDemo) {
        // Tạo token giả lập cho demo mode
        response = await demoApi.createDemoResponse({
          token: 'demo-jwt-token-refreshed',
          refreshToken: 'demo-refresh-token-refreshed',
        });
      } else {
        // Gọi API thực tế
        response = await api.post('/auth/refresh-token', { refreshToken });
      }
      
      const { token: newToken, refreshToken: newRefreshToken } = response.data;
      
      // Lưu token mới
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
      if (newRefreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }
      
      // Cập nhật Redux store
      store.dispatch(setToken(newToken));
      
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      
      // Xóa thông tin xác thực nếu refresh token thất bại
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      
      // Cập nhật Redux store
      store.dispatch(logoutUser());
      
      return null;
    }
  }
  
  // Quên mật khẩu
  async forgotPassword(email: string): Promise<boolean> {
    try {
      // Kiểm tra chế độ demo
      const isDemo = await demoApi.isDemoMode();
      
      if (isDemo) {
        // Trong chế độ demo, luôn trả về thành công
        console.log('Demo mode: Forgot password request for', email);
        return true;
      }
      
      // Trong chế độ thực tế, gọi API
      await api.post('/auth/forgot-password', { email });
      return true;
    } catch (error) {
      console.error('Forgot password error:', error);
      return false;
    }
  }
  
  // Lấy thông tin đăng nhập đã lưu (nếu remember me được kích hoạt)
  async getSavedLoginInfo(): Promise<{ email: string; rememberMe: boolean } | null> {
    try {
      const savedInfo = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      
      if (savedInfo) {
        return JSON.parse(savedInfo);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting saved login info:', error);
      return null;
    }
  }
  
  // Kích hoạt chế độ demo
  async enableDemoMode(enable: boolean = true): Promise<void> {
    try {
      if (enable) {
        await AsyncStorage.setItem(DEMO_MODE_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(DEMO_MODE_KEY);
      }
    } catch (error) {
      console.error('Error setting demo mode:', error);
    }
  }
  
  // Kiểm tra xem có đang ở chế độ demo không
  async isDemoMode(): Promise<boolean> {
    return demoApi.isDemoMode();
  }
}

// Export singleton instance
export default new AuthService(); 