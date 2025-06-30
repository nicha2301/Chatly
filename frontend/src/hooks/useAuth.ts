import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { User } from '../types';
import authService, { LoginCredentials, RegisterData } from '../services/authService';
import { setError, setToken, setUser, startLoading, stopLoading, logoutUser } from '../store/slices/userSlice';

export interface UseAuthReturn {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  clearError: () => void;
  isDemoMode: () => Promise<boolean>;
  enableDemoMode: (enable?: boolean) => Promise<void>;
  loginDemo: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isAuthenticated, isLoading, error } = useSelector((state: RootState) => state.user);
  const [initialized, setInitialized] = useState(false);

  // Kiểm tra trạng thái xác thực khi hook được khởi tạo
  useEffect(() => {
    if (!initialized) {
      const checkAuth = async () => {
        try {
          const isAuth = await authService.checkAuth();
          if (isAuth && !user) {
            await authService.getCurrentUser();
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
        } finally {
          setInitialized(true);
        }
      };
      
      checkAuth();
    }
  }, [dispatch, initialized, user]);

  // Đăng nhập
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch(startLoading());
      const user = await authService.login(credentials);
      dispatch(setUser(user));
      // token được cập nhật trong authService.login
    } catch (error: any) {
      dispatch(setError(error.message || 'Đăng nhập thất bại'));
      throw error;
    } finally {
      dispatch(stopLoading());
    }
  };

  // Đăng ký
  const register = async (userData: RegisterData): Promise<void> => {
    try {
      dispatch(startLoading());
      const user = await authService.register(userData);
      dispatch(setUser(user));
      // token được cập nhật trong authService.register
    } catch (error: any) {
      dispatch(setError(error.message || 'Đăng ký thất bại'));
      throw error;
    } finally {
      dispatch(stopLoading());
    }
  };

  // Đăng xuất
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      dispatch(logoutUser());
    } catch (error: any) {
      console.error('Logout error:', error);
      dispatch(setError(error.message || 'Đăng xuất thất bại'));
    }
  };

  // Quên mật khẩu
  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      dispatch(startLoading());
      const result = await authService.forgotPassword(email);
      return result;
    } catch (error: any) {
      dispatch(setError(error.message || 'Đặt lại mật khẩu thất bại'));
      return false;
    } finally {
      dispatch(stopLoading());
    }
  };

  // Xóa lỗi
  const clearError = (): void => {
    dispatch(setError(null));
  };

  // Kiểm tra chế độ demo
  const isDemoMode = async (): Promise<boolean> => {
    return authService.isDemoMode();
  };

  // Bật/tắt chế độ demo
  const enableDemoMode = async (enable: boolean = true): Promise<void> => {
    return authService.enableDemoMode(enable);
  };

  // Đăng nhập demo
  const loginDemo = async (): Promise<void> => {
    try {
      await enableDemoMode(true);
      await login({
        email: 'demo@example.com',
        password: 'password123',
        rememberMe: true
      });
    } catch (error: any) {
      dispatch(setError('Không thể đăng nhập với tài khoản demo'));
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    clearError,
    isDemoMode,
    enableDemoMode,
    loginDemo,
  };
}; 