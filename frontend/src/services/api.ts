import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { store } from '../store';
import { logoutUser, setToken } from '../store/slices/userSlice';

// Cấu hình API URL dựa trên môi trường
const BASE_URL = 
  Platform.OS === 'web'
    ? 'http://localhost:5000/api' // URL cho web
    : Platform.OS === 'android'
      ? 'http://10.0.2.2:5000/api' // URL cho Android emulator
      : 'http://localhost:5000/api'; // URL cho iOS

// Token và request config
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Tạo instance axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // Timeout sau 15s
});

// Interceptor yêu cầu
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Lấy token từ AsyncStorage
      const token = await AsyncStorage.getItem('auth_token');
      
      // Nếu có token, thêm vào header Authorization
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    } catch (error) {
      console.log('Error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor phản hồi
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Kiểm tra nếu là lỗi demo mode
    if (error.response?.status === 404 && error.config?.url?.includes('/api/')) {
      console.log('API endpoint not found (demo mode)');
      return Promise.reject(new Error('demo_mode'));
    }
    
    // Nếu lỗi 401 (Unauthorized) và chưa thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu đường dẫn là /auth/refresh-token, không thực hiện refresh token
      if (originalRequest.url === '/auth/refresh-token') {
        store.dispatch(logoutUser());
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // Nếu đang refresh token, thêm request hiện tại vào queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Lấy refresh token từ AsyncStorage
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // Không có refresh token, đăng xuất
          store.dispatch(logoutUser());
          processQueue(error);
          return Promise.reject(error);
        }
        
        // Gọi API refresh token
        const response = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        
        // Lưu token mới
        await AsyncStorage.setItem('auth_token', newToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refresh_token', newRefreshToken);
        }
        
        // Cập nhật token trong Redux store
        store.dispatch(setToken(newToken));
        
        // Cập nhật header Authorization
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Xử lý các request trong queue
        processQueue(null, newToken);
        
        return api(originalRequest);
      } catch (refreshError) {
        // Nếu refresh token thất bại, đăng xuất
        processQueue(error || refreshError);
        store.dispatch(logoutUser());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Xử lý các lỗi khác
    if (error.response) {
      // Phản hồi từ máy chủ với mã lỗi
      const errorData = error.response.data as { message?: string };
      const errorMessage = errorData?.message || 'Đã xảy ra lỗi từ máy chủ';
      console.log(`API Error (${error.response.status}): ${errorMessage}`);
      
      // Xử lý lỗi cụ thể
      switch (error.response.status) {
        case 400: // Bad Request
          return Promise.reject(new Error(errorMessage || 'Yêu cầu không hợp lệ'));
        case 403: // Forbidden
          return Promise.reject(new Error(errorMessage || 'Bạn không có quyền truy cập'));
        case 404: // Not Found
          return Promise.reject(new Error(errorMessage || 'Không tìm thấy tài nguyên'));
        case 500: // Server Error
          return Promise.reject(new Error(errorMessage || 'Lỗi máy chủ'));
        default:
          return Promise.reject(new Error(errorMessage || `Lỗi không xác định (${error.response.status})`));
      }
    } else if (error.request) {
      // Yêu cầu được gửi nhưng không nhận được phản hồi
      console.log('Network Error: Không nhận được phản hồi từ máy chủ');
      return Promise.reject(new Error('Lỗi mạng: Kiểm tra kết nối internet của bạn'));
    } else {
      // Lỗi khi thiết lập request
      console.log('Error:', error.message);
      return Promise.reject(error);
    }
  }
);

// Export default instance
export default api;

// Export helper functions để sử dụng trong demo mode
export const demoApi = {
  // Tạo response giả lập cho demo mode
  createDemoResponse: (data: any): Promise<AxiosResponse<any>> => {
    return Promise.resolve({
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });
  },
  
  // Tạo lỗi giả lập cho demo mode
  createDemoError: (status: number, message: string): Promise<never> => {
    return Promise.reject({
      response: {
        data: { message },
        status,
        statusText: 'ERROR',
        headers: {},
      },
    });
  },
  
  // Kiểm tra nếu đang ở chế độ demo
  isDemoMode: async (): Promise<boolean> => {
    const demoMode = await AsyncStorage.getItem('demo_mode');
    return demoMode === 'true';
  },
};

// Tạo axios instance cho download files
export const downloadApi = axios.create({
  baseURL: BASE_URL,
  responseType: 'blob',
  timeout: 30000,
});

// Interceptor yêu cầu cho download
downloadApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Lấy token từ AsyncStorage
    const token = await AsyncStorage.getItem('auth_token');
    
    // Nếu có token, thêm vào header Authorization
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
); 