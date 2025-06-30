import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Socket URL dựa trên môi trường
const SOCKET_URL = 
  Platform.OS === 'web'
    ? 'http://localhost:5000' // URL cho web
    : Platform.OS === 'android'
      ? 'http://10.162.5.200:5000' // URL cho Android emulator
      : 'http://localhost:5000'; // URL cho iOS

class SocketService {
  private socket: Socket | null = null;
  private reconnectionAttempts = 0;
  private maxReconnectionAttempts = 5;
  private listeners: { [event: string]: Function[] } = {};

  // Kết nối đến socket server
  async connect() {
    try {
      if (this.socket?.connected) {
        console.log('Socket is already connected');
        return this.socket;
      }

      // Lấy token từ AsyncStorage
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        console.error('No token available for socket connection');
        return null;
      }

      // Tạo kết nối socket với token xác thực
      this.socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectionAttempts,
        transports: ['websocket'],
      });

      // Xử lý các sự kiện kết nối
      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.reconnectionAttempts = 0;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        this.reconnectionAttempts++;

        // Nếu lỗi liên quan đến xác thực
        if (error.message.includes('auth')) {
          // Cố gắng làm mới token
          this.refreshToken();
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      return this.socket;
    } catch (error) {
      console.error('Error connecting to socket:', error);
      return null;
    }
  }

  // Làm mới token khi kết nối thất bại
  private async refreshToken() {
    try {
      // Nếu đã cố gắng kết nối quá nhiều lần
      if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
        this.disconnect();
        return;
      }

      // Lấy refresh token
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        console.error('No refresh token available');
        return;
      }

      // Gọi API refresh token
      const response = await fetch(`${SOCKET_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      // Lưu token mới
      await AsyncStorage.setItem('auth_token', data.token);
      
      // Kết nối lại với token mới
      if (this.socket) {
        this.socket.auth = { token: data.token };
        this.socket.connect();
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }

  // Ngắt kết nối socket
  disconnect() {
    if (this.socket) {
      Object.keys(this.listeners).forEach(event => {
        this.listeners[event].forEach(callback => {
          this.socket?.off(event, callback as any);
        });
      });
      
      this.socket.disconnect();
      this.socket = null;
      this.listeners = {};
      console.log('Socket disconnected');
    }
  }

  // Đăng ký lắng nghe sự kiện
  on(event: string, callback: Function) {
    if (!this.socket) {
      console.warn('Socket not connected. Connect first.');
      return;
    }

    this.socket.on(event, callback as any);
    
    // Lưu lại callback để có thể gỡ bỏ sau này
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // Hủy đăng ký lắng nghe sự kiện
  off(event: string, callback?: Function) {
    if (!this.socket) {
      return;
    }

    if (callback) {
      this.socket.off(event, callback as any);
      
      // Xóa callback khỏi danh sách
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      }
    } else {
      // Hủy tất cả các callback cho sự kiện này
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => {
          this.socket?.off(event, cb as any);
        });
        delete this.listeners[event];
      }
    }
  }

  // Gửi sự kiện
  emit(event: string, data: any, callback?: Function) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected. Connect first.');
      return;
    }

    this.socket.emit(event, data, callback);
  }

  // Kiểm tra trạng thái kết nối
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Xuất singleton instance
export default new SocketService(); 